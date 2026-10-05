"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DESCRICAO_VIA, detectarFonte, type FonteDetectada } from "@/lib/descobrir-fonte";
import { coletarFonte } from "@/lib/leitor-feeds";
import { nomeDaFonte } from "@/lib/fonte";
import { dispararColetaDaFonte } from "@/lib/github";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ResultadoAdicionar = {
  erro?: string;
  fonteId?: string;
  nome?: string;
  /** Como a fonte foi entendida ("feed RSS", "site sem RSS, lido pelo Google Notícias"...) */
  como?: string;
  /** Notícias que já estavam no banco (mesma fonte em outro lugar, ou catálogo) */
  importadas?: number;
  /** Notícias coletadas agora, na hora de adicionar */
  coletadas?: number;
};

/** Usa a coleção escolhida; sem nenhuma, cria (ou reaproveita) uma com o nome sugerido. */
async function resolverColecao(supabase: Supabase, userId: string, topicId: string, nomeNova: string) {
  if (topicId) return topicId;
  const nome = nomeNova.trim();
  if (!nome) return null;
  const { data: existente } = await supabase.from("topics").select("id").eq("name", nome).maybeSingle();
  if (existente) return existente.id as string;
  const { data: nova, error } = await supabase
    .from("topics")
    .insert({ user_id: userId, name: nome })
    .select("id")
    .single();
  return error ? null : (nova.id as string);
}

/** Adicionar fonte, por qualquer caminho (catálogo, "por URL", Organizar):
 * 1. entende o link (RSS? site com RSS escondido? sitemap? Google Notícias?);
 * 2. não deixa seguir duas vezes a mesma fonte;
 * 3. aproveita as notícias que já estão no banco (sql/023);
 * 4. coleta na hora, pra fonte já aparecer com notícias. */
export async function adicionarFonte(pedido: {
  url?: string;
  catalogoId?: string;
  nome?: string;
  topicId?: string;
  novaColecao?: string;
}): Promise<ResultadoAdicionar> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  // 1) o que é essa fonte?
  let fonte: FonteDetectada | undefined;
  let categoriaSugerida: string | null = null;
  if (pedido.catalogoId) {
    const { data: item } = await supabase
      .from("feed_catalog")
      .select("name, url, category, kind")
      .eq("id", pedido.catalogoId)
      .maybeSingle();
    if (!item) return { erro: "Fonte não encontrada no catálogo." };
    fonte = { url: item.url, tipo: item.kind === "sitemap" ? "sitemap" : "rss", nome: item.name, via: "catalogo" };
    categoriaSugerida = item.category;
  } else {
    const detectado = await detectarFonte(supabase, pedido.url ?? "");
    if (!detectado.fonte) return { erro: detectado.erro };
    fonte = detectado.fonte;
    if (detectado.catalogoId) {
      const { data: item } = await supabase
        .from("feed_catalog")
        .select("category")
        .eq("id", detectado.catalogoId)
        .maybeSingle();
      categoriaSugerida = item?.category ?? null;
    }
  }

  // 2) já segue? (a mesma URL em qualquer coleção sua)
  const { data: jaSegue } = await supabase
    .from("sources")
    .select("id, topics(name)")
    .eq("url", fonte.url)
    .limit(1)
    .maybeSingle();
  if (jaSegue) {
    const colecao = (jaSegue.topics as unknown as { name: string } | null)?.name;
    return { erro: `Você já segue essa fonte${colecao ? ` na coleção ${colecao}` : ""}.`, fonteId: jaSegue.id };
  }

  const colecao = await resolverColecao(
    supabase,
    user.id,
    pedido.topicId ?? "",
    pedido.novaColecao ?? categoriaSugerida ?? "",
  );
  if (!colecao) return { erro: "Escolha uma coleção ou dê nome a uma nova." };

  const nome = pedido.nome?.trim() || fonte.nome || null;
  const { data: criada, error } = await supabase
    .from("sources")
    .insert({ topic_id: colecao, url: fonte.url, name: nome, type: fonte.tipo })
    .select("id")
    .single();
  if (error || !criada) return { erro: "Não foi possível adicionar a fonte. Tenta de novo." };

  // 3) notícias que já estão no banco
  const { data: importadas } = await supabase.rpc("importar_noticias_existentes", { p_source_id: criada.id });

  // 4) coleta na hora. Se o site falhar, a fonte fica adicionada do mesmo
  // jeito: o coletor diário tenta de novo (e cai no Google Notícias).
  let coletadas = 0;
  try {
    const noticias = await coletarFonte(fonte.url, fonte.tipo);
    if (noticias.length > 0) {
      const { data: inseridas } = await supabase
        .from("articles")
        .upsert(
          noticias.map((n) => ({ ...n, source_id: criada.id })),
          { onConflict: "source_id,url", ignoreDuplicates: true },
        )
        .select("id");
      coletadas = inseridas?.length ?? 0;
    }
  } catch {
    // segue sem as notícias de agora
  }

  // Coleta completa + resumo da IA no GitHub Actions (se configurado)
  await dispararColetaDaFonte(criada.id);

  revalidatePath("/", "layout");
  return {
    fonteId: criada.id,
    nome: nomeDaFonte(nome, fonte.url),
    como: DESCRICAO_VIA[fonte.via],
    importadas: typeof importadas === "number" ? importadas : 0,
    coletadas,
  };
}
