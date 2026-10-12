import type { SupabaseClient } from "@supabase/supabase-js";
import type { Noticia } from "./leitor-feeds";
import { DIAS_PRA_COMPARAR, separarRepetidas } from "./manchetes";

/** Onde gravar: as notícias de um feed seguido, ou as de uma fonte da
 * vitrine do catálogo. Só com o cliente admin (chave secreta, admin.ts). */
export type Destino = { tabela: "articles"; feedId: string } | { tabela: "catalog_articles"; catalogoId: string };

/** Grava sem repetir a mesma notícia que já veio pelo outro caminho
 * (link direto x Google Notícias, manchetes.ts). Devolve quantas entraram
 * (novas + promovidas). */
export async function gravarNoticias(admin: SupabaseClient, destino: Destino, noticias: Noticia[]) {
  const coluna = destino.tabela === "articles" ? "feed_id" : "catalog_id";
  const id = destino.tabela === "articles" ? destino.feedId : destino.catalogoId;
  const desde = new Date(Date.now() - DIAS_PRA_COMPARAR * 86_400_000).toISOString();

  const { data: existentes } = await admin
    .from(destino.tabela)
    .select("id, url, title")
    .eq(coluna, id)
    .gte("collected_at", desde);
  const { inserir, promover } = separarRepetidas(
    (existentes ?? []) as { id: string; url: string; title: string }[],
    noticias.filter((n) => n.url),
  );

  let gravadas = 0;
  if (inserir.length > 0) {
    const { data } = await admin
      .from(destino.tabela)
      .upsert(
        inserir.map((n) => ({ ...n, [coluna]: id })),
        { onConflict: destino.tabela === "articles" ? "feed_id,url" : "url", ignoreDuplicates: true },
      )
      .select("id");
    gravadas += data?.length ?? 0;
  }

  for (const [idExistente, n] of promover) {
    const { count } = await admin
      .from(destino.tabela)
      .select("id", { count: "exact", head: true })
      .eq(coluna, id)
      .eq("url", n.url);
    if (count) continue; // o link direto já está no feed
    const mudanca: Record<string, unknown> = {
      url: n.url,
      title: n.title,
      enriquecido_em: null,
      // volta pra fila da IA, agora com texto
      ai_summary: null,
      ...(destino.tabela === "articles" ? { category: null } : {}),
    };
    if (n.content) mudanca.content = n.content;
    if (n.image_url) mudanca.image_url = n.image_url;
    if (n.author) mudanca.author = n.author;
    if (n.published_at) mudanca.published_at = n.published_at;
    const { error } = await admin.from(destino.tabela).update(mudanca).eq("id", idExistente);
    if (!error) gravadas++;
  }
  return gravadas;
}
