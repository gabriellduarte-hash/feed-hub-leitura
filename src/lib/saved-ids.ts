import { SupabaseClient } from "@supabase/supabase-js";

/** IDs de artigo já salvos pelo usuário logado — usado nas 3 telas que
 * mostram o botão de "ler mais tarde" (feed, busca, ler mais tarde). */
export async function buscarIdsSalvos(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase.from("saved_articles").select("article_id");
  return new Set((data ?? []).map((row) => row.article_id as string));
}
