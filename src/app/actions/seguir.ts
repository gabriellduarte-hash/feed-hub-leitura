"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { combina, expressaoDaPalavra, palavrasDaBusca } from "@/lib/busca";
import { CATEGORIAS } from "@/lib/feed";
import { MAX_SEGUINDO, normalizarChave, type ItemSeguido, type SugestaoSeguir } from "@/lib/seguir";

/* Seguir temas e nomes (tabela seguindo, sql/045). A RLS garante que cada
 * um só mexe no que é seu; aqui só confere o formato do que veio do
 * navegador. */

function valido(item: ItemSeguido) {
  if (item.tipo !== "tema" && item.tipo !== "nome") return false;
  if (typeof item.chave !== "string" || typeof item.rotulo !== "string") return false;
  if (!item.chave.trim() || item.chave.length > 80 || !item.rotulo.trim() || item.rotulo.length > 80) return false;
  // nome: a chave já vem normalizada do coletor
  return item.tipo === "tema" || normalizarChave(item.chave) === item.chave;
}

export async function seguir(item: ItemSeguido): Promise<{ erro?: string }> {
  if (!valido(item)) return { erro: "Não deu pra seguir isso." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre de novo pra seguir." };

  const { count } = await supabase.from("seguindo").select("chave", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_SEGUINDO) return { erro: `Você já segue ${MAX_SEGUINDO} temas e nomes. Deixe de seguir algum antes.` };

  const { error } = await supabase
    .from("seguindo")
    .upsert(
      { user_id: user.id, tipo: item.tipo, chave: item.chave, rotulo: item.rotulo.trim() },
      { onConflict: "user_id,tipo,chave", ignoreDuplicates: true },
    );
  if (error) return { erro: "Não deu pra seguir agora. Tente de novo." };
  revalidatePath("/", "layout");
  return {};
}

export async function deixarDeSeguir(item: Pick<ItemSeguido, "tipo" | "chave">): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre de novo." };
  const { error } = await supabase
    .from("seguindo")
    .delete()
    .eq("user_id", user.id)
    .eq("tipo", item.tipo)
    .eq("chave", String(item.chave).slice(0, 80));
  if (error) return { erro: "Não deu pra deixar de seguir agora. Tente de novo." };
  revalidatePath("/", "layout");
  return {};
}

export type TemaDoCatalogo = { nome: string; grupo: string; sinonimos: string[]; noticias: number };

/** O catálogo de temas (catalogo_temas, sql/047: o coletor copia de
 * temas.py), na ordem dos assuntos, com quantas notícias cada tema teve
 * nos últimos 3 dias. */
export async function catalogoDeTemas(): Promise<TemaDoCatalogo[]> {
  const supabase = await createClient();
  const [{ data: catalogo }, { data: contagem }] = await Promise.all([
    supabase.from("catalogo_temas").select("nome, grupo, sinonimos").order("ordem"),
    supabase.from("sugestoes_seguir").select("chave, noticias").eq("tipo", "tema"),
  ]);
  const noticias = new Map((contagem ?? []).map((c) => [c.chave as string, c.noticias as number]));
  return ((catalogo ?? []) as Omit<TemaDoCatalogo, "noticias">[]).map((t) => ({ ...t, noticias: noticias.get(t.nome) ?? 0 }));
}

/** Os temas que a busca de notícias soma ("fofoca" traz também as
 * notícias marcadas com Fofoca). Pelo nome ou sinônimo, mas um tema amplo
 * (a categoria inteira: Cinema, Games) só quando o nome bate ("games"
 * sim; "séries" não puxa todo o Cinema). */
export async function temasDaBusca(busca: string) {
  const palavras = palavrasDaBusca(String(busca ?? "").slice(0, 60));
  if (palavras.length === 0) return [];
  return (await catalogoDeTemas())
    .filter((t) => combina([t.nome, ...t.sinonimos], palavras))
    .filter((t) => combina([t.nome], palavras) || !CATEGORIAS.includes(t.nome))
    .map((t) => t.nome);
}

/** Temas do catálogo (pelo nome ou sinônimo, no singular ou plural: "hq"
 * acha Quadrinhos, "filme" acha Filmes) e nomes citados nos últimos 3
 * dias (tabela sugestoes_seguir, que o coletor refaz de hora em hora).
 * Sem busca: os mais citados. */
export async function sugerirParaSeguir(busca: string): Promise<SugestaoSeguir[]> {
  const palavras = palavrasDaBusca(String(busca ?? "").slice(0, 60));
  const supabase = await createClient();
  let nomes = supabase
    .from("sugestoes_seguir")
    .select("tipo, chave, rotulo, detalhe, noticias")
    .eq("tipo", "nome")
    .order("noticias", { ascending: false });
  // cada palavra no começo de uma palavra do nome: "lula" acha "Lula" e
  // "Luiz Inácio Lula", não "celulares"; a última pode estar pela metade
  palavras.forEach((p, i) => {
    nomes = nomes.filter("chave", "match", expressaoDaPalavra(p, i === palavras.length - 1));
  });
  const [catalogo, { data: achados }] = await Promise.all([catalogoDeTemas(), nomes.limit(palavras.length ? 8 : 12)]);

  const temas = catalogo
    .filter((t) => (palavras.length ? combina([t.nome, ...t.sinonimos], palavras) : t.noticias > 0))
    .map((t) => ({
      tipo: "tema" as const,
      chave: t.nome,
      rotulo: t.nome,
      detalhe: t.grupo,
      noticias: t.noticias,
      // na busca, quem bate pelo nome vem antes de quem bate pelo sinônimo
      peloNome: palavras.length > 0 && combina([t.nome], palavras),
    }))
    .sort((a, b) => Number(b.peloNome) - Number(a.peloNome) || b.noticias - a.noticias)
    .map((t) => ({ tipo: t.tipo, chave: t.chave, rotulo: t.rotulo, detalhe: t.detalhe, noticias: t.noticias }));
  return [...temas.slice(0, palavras.length ? 5 : 6), ...((achados ?? []) as SugestaoSeguir[])].slice(0, palavras.length ? 10 : 18);
}

/** Nomes que surgiram: muito mais citados nas últimas 24h do que nos dias
 * antes (sugestoes_seguir.em_alta, sql/048; o coletor calcula). */
export async function surgindoAgora(): Promise<SugestaoSeguir[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sugestoes_seguir")
    .select("tipo, chave, rotulo, detalhe, noticias")
    .not("em_alta", "is", null)
    .order("em_alta", { ascending: false })
    .limit(10);
  return (data ?? []) as SugestaoSeguir[];
}

/** Os temas e nomes que mais aparecem junto de um tema ou nome nos
 * últimos 7 dias (função relacionados, sql/048): Marvel -> Super-heróis. */
export async function relacionadosA(item: Pick<ItemSeguido, "tipo" | "chave">): Promise<SugestaoSeguir[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("relacionados", { p_tipo: item.tipo, p_chave: item.chave });
  return ((data ?? []) as { tipo: "tema" | "nome"; chave: string; rotulo: string; noticias: number }[]).map((r) => ({
    ...r,
    detalhe: null,
  }));
}
