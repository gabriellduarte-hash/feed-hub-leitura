"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Usa a coleção escolhida; se não veio nenhuma, cria (ou reaproveita)
 * uma com o nome sugerido. */
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

export async function seguirFeedDoCatalogo(formData: FormData): Promise<{ erro?: string } | undefined> {
  const catalogoId = formData.get("catalog_id") as string;
  const topicId = (formData.get("topic_id") as string) ?? "";
  if (!catalogoId) return { erro: "Fonte inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  // Nome/URL/categoria vêm do catálogo no banco, não do formulário —
  // o cliente só diz qual item quer seguir.
  const { data: item } = await supabase
    .from("feed_catalog")
    .select("name, url, category, kind")
    .eq("id", catalogoId)
    .maybeSingle();
  if (!item) return { erro: "Fonte não encontrada no catálogo." };

  const colecao = await resolverColecao(supabase, user.id, topicId, item.category);
  if (!colecao) return { erro: "Não foi possível criar a coleção." };

  const { error } = await supabase
    .from("sources")
    // sitemap (sql/021) vira uma fonte do tipo sitemap; o resto, inclusive o
    // RSS do Google Notícias, é RSS comum pro coletor
    .insert({ topic_id: colecao, url: item.url, name: item.name, type: item.kind === "sitemap" ? "sitemap" : "rss" });
  // 23505: já segue esse feed nessa coleção — clicar de novo não quebra nada
  if (error && error.code !== "23505") return { erro: "Não foi possível seguir essa fonte." };

  revalidatePath("/", "layout");
}

export type EstadoSeguirUrl = { erro?: string; ok?: string } | undefined;

export async function seguirPorUrl(
  _anterior: EstadoSeguirUrl,
  formData: FormData,
): Promise<EstadoSeguirUrl> {
  const url = ((formData.get("url") as string) ?? "").trim();
  const nome = ((formData.get("name") as string) ?? "").trim();
  const tipoEscolhido = formData.get("type");
  const tipo = tipoEscolhido === "scrape" || tipoEscolhido === "sitemap" ? tipoEscolhido : "rss";
  const topicId = (formData.get("topic_id") as string) ?? "";
  const nomeNova = (formData.get("nova_colecao") as string) ?? "";

  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    return { erro: "Cole uma URL completa, começando com http:// ou https://" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  const colecao = await resolverColecao(supabase, user.id, topicId, nomeNova);
  if (!colecao) return { erro: "Escolha uma coleção ou dê nome a uma nova." };

  const { error } = await supabase
    .from("sources")
    .insert({ topic_id: colecao, url, name: nome || null, type: tipo });
  if (error) {
    return {
      erro:
        error.code === "23505"
          ? "Essa URL já está nessa coleção."
          : "Não deu pra adicionar a fonte. Tenta de novo.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: "Fonte adicionada. Os artigos aparecem depois da próxima coleta." };
}
