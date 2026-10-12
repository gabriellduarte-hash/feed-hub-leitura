"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { detectarFonte, type FonteDetectada } from "@/lib/descobrir-fonte";
import { coletarFonte, type Noticia } from "@/lib/leitor-feeds";
import { nomeDaFonte } from "@/lib/fonte";
import { dispararColetaDaFonte } from "@/lib/github";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ResultadoAdicionar = {
  erro?: string;
  fonteId?: string;
  nome?: string;
  /** Notícias que já estavam no banco (alguém já seguia o feed, ou catálogo) */
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

// Ao seguir, só as notícias das últimas 24h (o catálogo é um mapa: a fonte
// não tinha nada coletado). Sem nenhuma (fonte que publica pouco), as
// mais recentes, pra não aparecer vazia. Igual ao coletor (coletar.py).
const HORAS_AO_SEGUIR = 24;
const RESERVA_AO_SEGUIR = 5;

function soRecentes(noticias: Noticia[]): Noticia[] {
  const limite = Date.now() - HORAS_AO_SEGUIR * 3600_000;
  const quando = (n: Noticia) => (n.published_at ? Date.parse(n.published_at) : NaN);
  const recentes = noticias.filter((n) => !(quando(n) < limite)); // sem data: não dá pra saber, fica
  if (recentes.length > 0) return recentes;
  return [...noticias].sort((a, b) => (quando(b) || 0) - (quando(a) || 0)).slice(0, RESERVA_AO_SEGUIR);
}

/** Adicionar fonte, por qualquer caminho (catálogo, "por URL", Organizar):
 * 1. entende o link (RSS? site com RSS escondido? sitemap? Google Notícias?);
 * 2. não deixa seguir duas vezes a mesma fonte;
 * 3. segue o feed (sql/038): se alguém já seguia, as notícias já estão
 *    no banco e aparecem na hora, sem coletar de novo;
 * 4. feed novo: importa as das últimas 24h que o catálogo já tem e coleta
 *    na hora, pra fonte já aparecer com notícias. */
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
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  // 1) o que é essa fonte?
  let fonte: FonteDetectada | undefined;
  let categoriaSugerida: string | null = null;
  if (pedido.catalogoId) {
    const { data: item } = await supabase
      .from("feed_catalog")
      .select("name, url, category, kind")
      .eq("id", pedido.catalogoId)
      .maybeSingle();
    if (!item) return { erro: "Essa fonte não está mais disponível." };
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
  const { data: seguida, error } = await supabase
    .rpc("seguir_fonte", { p_topic_id: colecao, p_url: fonte.url, p_tipo: fonte.tipo, p_nome: nome })
    .single<{ fonte_id: string; feed: string; feed_novo: boolean }>();
  if (error || !seguida) return { erro: "Não foi possível adicionar a fonte. Tente de novo." };

  let importadas = 0;
  let coletadas = 0;
  if (!seguida.feed_novo) {
    // 3) alguém já seguia: as notícias do feed já estão aqui
    const desde = new Date(Date.now() - HORAS_AO_SEGUIR * 3600_000).toISOString();
    const { count } = await supabase
      .from("artigos_do_usuario")
      .select("id", { count: "exact", head: true })
      .eq("source_id", seguida.fonte_id)
      .gte("collected_at", desde);
    importadas = count ?? 0;
  } else {
    // 4) feed novo: o que o catálogo já tem...
    const { data } = await supabase.rpc("importar_do_catalogo", { p_fonte_id: seguida.fonte_id });
    importadas = typeof data === "number" ? data : 0;

    // ...e a coleta na hora, gravada com a chave secreta (ver admin.ts).
    // Se o site falhar ou a chave não existir, a fonte fica seguida do
    // mesmo jeito: o workflow e a coleta de hora em hora completam.
    const admin = clienteAdmin();
    if (admin) {
      try {
        const noticias = soRecentes(await coletarFonte(fonte.url, fonte.tipo));
        if (noticias.length > 0) {
          const { data: inseridas } = await admin
            .from("articles")
            .upsert(
              noticias.map((n) => ({ ...n, feed_id: seguida.feed })),
              { onConflict: "feed_id,url", ignoreDuplicates: true },
            )
            .select("id");
          coletadas = inseridas?.length ?? 0;
        }
      } catch {
        // segue sem as notícias de agora
      }
    }

    // Coleta completa + resumo da IA no GitHub Actions (se configurado).
    // Se falhar, só vai pro log da Vercel.
    const disparo = await dispararColetaDaFonte(seguida.feed);
    if (!disparo.ok) console.warn(`[fonte-nova] ${disparo.motivo}`);
  }

  revalidatePath("/", "layout");
  return {
    fonteId: seguida.fonte_id,
    nome: nomeDaFonte(nome, fonte.url),
    importadas,
    coletadas,
  };
}
