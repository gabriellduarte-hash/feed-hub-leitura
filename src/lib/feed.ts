import type { SupabaseClient } from "@supabase/supabase-js";
import { hostDe, nomeDaFonte } from "./fonte";

export type ArtigoLista = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  ai_summary: string | null;
  category: string | null;
  image_url: string | null;
  fonteId: string;
  fonteNome: string;
  fonteHost: string;
  tempo: string;
  dataCompleta: string;
  dia: string;
  rotuloDia: string;
  lido: boolean;
  salvo: boolean;
  /** "catalogo" = notícia de uma fonte do catálogo (aba Explorar), que o
   * usuário pode não seguir: não tem lido/salvo, porque essas tabelas
   * apontam pra articles, não pra catalog_articles. */
  origem: "usuario" | "catalogo";
};

type LinhaArtigo = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  ai_summary: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string | null;
  collected_at: string;
  source_id: string;
  sources: { id: string; name: string | null; url: string; topic_id: string };
};

const SELECT_ARTIGO =
  "id, title, url, author, content, ai_summary, category, image_url, published_at, collected_at, source_id, sources!inner(id, name, url, topic_id)";

const FUSO = "America/Sao_Paulo";

function dataDoArtigo(linha: { published_at: string | null; collected_at: string }) {
  return new Date(linha.published_at ?? linha.collected_at);
}

export function tempoRelativo(data: Date, agora = new Date()) {
  const min = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / 60000));
  if (min < 60) return `${Math.max(1, min)}min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `${dias}d`;
  return data.toLocaleDateString("pt-BR", { timeZone: FUSO });
}

function dataCompleta(data: Date) {
  return data.toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diaLocal(data: Date) {
  return data.toLocaleDateString("en-CA", { timeZone: FUSO }); // AAAA-MM-DD
}

/** "Hoje", "Ontem" ou "Terça-feira, 29 de setembro" (com ano se não for o atual). */
function rotuloDoDia(data: Date, agora: Date) {
  const dia = diaLocal(data);
  if (dia === diaLocal(agora)) return "Hoje";
  if (dia === diaLocal(new Date(agora.getTime() - 86400000))) return "Ontem";
  const mesmoAno = dia.slice(0, 4) === diaLocal(agora).slice(0, 4);
  const texto = data.toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(mesmoAno ? {} : { year: "numeric" }),
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export type FiltroArtigos = {
  fonteId?: string;
  topicoId?: string;
  ids?: string[];
  busca?: string;
  limite?: number;
  offset?: number;
};

/** O que a rolagem infinita manda de volta pro servidor pra pedir a próxima página. */
export type FiltroPagina = {
  fonteId?: string;
  topicoId?: string;
  /** Lista notícias do catálogo (aba Explorar) em vez dos artigos do usuário */
  catalogo?: boolean;
  categoria?: string;
};

export const TAMANHO_PAGINA = 30;

/** Busca artigos (RLS garante que só vêm os do usuário) já com o nome
 * da fonte, tempo relativo e os estados lido/salvo do usuário. */
export async function buscarArtigos(
  supabase: SupabaseClient,
  filtro: FiltroArtigos = {},
): Promise<ArtigoLista[]> {
  // Ordem por publicação (é por ela que o feed agrupa os dias) + id pra
  // desempatar. Não dá pra paginar por collected_at: o coletor grava a
  // rodada inteira com o mesmo horário, e a página "pularia" artigos.
  const inicio = filtro.offset ?? 0;
  let consulta = supabase
    .from("articles")
    .select(SELECT_ARTIGO)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id")
    .range(inicio, inicio + (filtro.limite ?? 60) - 1);

  if (filtro.fonteId) consulta = consulta.eq("source_id", filtro.fonteId);
  if (filtro.topicoId) consulta = consulta.eq("sources.topic_id", filtro.topicoId);
  if (filtro.ids) consulta = consulta.in("id", filtro.ids);
  if (filtro.busca) {
    // vírgula e parênteses têm significado na sintaxe do .or() do
    // PostgREST — tirar evita que o termo digitado vire filtro extra
    const termo = filtro.busca.replace(/[,()]/g, " ").trim();
    if (termo) consulta = consulta.or(`title.ilike.%${termo}%,content.ilike.%${termo}%`);
  }

  const { data } = await consulta;
  const linhas = (data ?? []) as unknown as LinhaArtigo[];
  return enriquecer(supabase, linhas);
}

async function enriquecer(supabase: SupabaseClient, linhas: LinhaArtigo[]) {
  if (linhas.length === 0) return [];
  const ids = linhas.map((l) => l.id);

  const [{ data: lidos }, { data: salvos }] = await Promise.all([
    supabase.from("read_articles").select("article_id").in("article_id", ids),
    supabase.from("saved_articles").select("article_id").in("article_id", ids),
  ]);
  const setLidos = new Set((lidos ?? []).map((r) => r.article_id as string));
  const setSalvos = new Set((salvos ?? []).map((r) => r.article_id as string));
  const agora = new Date();

  return linhas.map((l) => {
    const data = dataDoArtigo(l);
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      author: l.author,
      content: l.content,
      ai_summary: l.ai_summary,
      category: l.category,
      image_url: l.image_url,
      fonteId: l.sources.id,
      fonteNome: nomeDaFonte(l.sources.name, l.sources.url),
      fonteHost: hostDe(l.sources.url),
      tempo: tempoRelativo(data, agora),
      dataCompleta: dataCompleta(data),
      dia: diaLocal(data),
      rotuloDia: rotuloDoDia(data, agora),
      lido: setLidos.has(l.id),
      salvo: setSalvos.has(l.id),
      origem: "usuario" as const,
    };
  });
}

/** Busca na ordem de uma lista de ids (ex.: lidos recentemente, ler mais tarde). */
export async function buscarArtigosNaOrdem(supabase: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return [];
  const artigos = await buscarArtigos(supabase, { ids, limite: ids.length });
  const porId = new Map(artigos.map((a) => [a.id, a]));
  return ids.map((id) => porId.get(id)).filter((a): a is ArtigoLista => !!a);
}

export type Secao = { titulo: string; artigos: ArtigoLista[] };

/** Uma página do feed: pede um item a mais só pra saber se ainda tem próxima. */
export async function buscarPagina(supabase: SupabaseClient, filtro: FiltroPagina, offset = 0) {
  const artigos = filtro.catalogo
    ? await buscarNoticiasDoCatalogo(supabase, filtro.categoria, offset, TAMANHO_PAGINA + 1)
    : await buscarArtigos(supabase, { fonteId: filtro.fonteId, topicoId: filtro.topicoId, offset, limite: TAMANHO_PAGINA + 1 });
  return { artigos: artigos.slice(0, TAMANHO_PAGINA), temMais: artigos.length > TAMANHO_PAGINA };
}

type LinhaCatalogo = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  ai_summary: string | null;
  image_url: string | null;
  published_at: string | null;
  collected_at: string;
  feed_catalog: { id: string; name: string; url: string; category: string };
};

/** Notícias das fontes do catálogo (tabela catalog_articles, sql/020),
 * no mesmo formato da lista de artigos do usuário. */
async function buscarNoticiasDoCatalogo(
  supabase: SupabaseClient,
  categoria: string | undefined,
  offset: number,
  limite: number,
): Promise<ArtigoLista[]> {
  let consulta = supabase
    .from("catalog_articles")
    .select(
      "id, title, url, author, content, ai_summary, image_url, published_at, collected_at, feed_catalog!inner(id, name, url, category)",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id")
    .range(offset, offset + limite - 1);
  if (categoria) consulta = consulta.eq("feed_catalog.category", categoria);

  const { data } = await consulta;
  const agora = new Date();
  return ((data ?? []) as unknown as LinhaCatalogo[]).map((l) => {
    const data = dataDoArtigo(l);
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      author: l.author,
      content: l.content,
      ai_summary: l.ai_summary,
      category: l.feed_catalog.category,
      image_url: l.image_url,
      fonteId: l.feed_catalog.id,
      fonteNome: l.feed_catalog.name,
      fonteHost: hostDe(l.feed_catalog.url),
      tempo: tempoRelativo(data, agora),
      dataCompleta: dataCompleta(data),
      dia: diaLocal(data),
      rotuloDia: rotuloDoDia(data, agora),
      lido: false,
      salvo: false,
      origem: "catalogo" as const,
    };
  });
}

/** Categorias que têm fonte na vitrine do catálogo (os filtros da aba
 * Explorar do Início: só as da vitrine são coletadas, sql/031). */
export async function categoriasDoCatalogo(supabase: SupabaseClient) {
  const { data } = await supabase.from("feed_catalog").select("category").eq("vitrine", true);
  const presentes = new Set((data ?? []).map((c) => c.category as string));
  return CATEGORIAS.filter((c) => presentes.has(c));
}

/** Agrupa por data de publicação, mantendo a ordem em que os dias aparecem. */
export function agruparPorDia(artigos: ArtigoLista[]): Secao[] {
  const grupos = new Map<string, ArtigoLista[]>();
  for (const artigo of artigos) {
    if (!grupos.has(artigo.rotuloDia)) grupos.set(artigo.rotuloDia, []);
    grupos.get(artigo.rotuloDia)!.push(artigo);
  }
  return [...grupos.entries()].map(([titulo, artigos]) => ({ titulo, artigos }));
}

// Mesma lista do catálogo (catalogo/catalogar.py): as categorias que a IA
// dá pra cada notícia, mais três só do catálogo pra organizar a
// descoberta ("Notícias", "Meio ambiente", "Automóveis")
export const CATEGORIAS = [
  "Notícias", "Política", "Finanças", "Tecnologia", "Ciência", "Meio ambiente",
  "Saúde", "Esportes", "Entretenimento", "Automóveis", "Mundo", "Humor", "Outros",
];

export type Sugestao = { id: string; nome: string; host: string; descricao: string | null; categoria: string };

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

function maisFrequente(valores: (string | null)[]) {
  const contagem = new Map<string, number>();
  for (const v of valores) if (v) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** Categoria editorial de uma coleção, na ordem de confiança:
 * 1. o próprio nome já é uma categoria ("Tecnologia", "financas"...);
 * 2. a categoria que o catálogo dá pras fontes dela;
 * 3. a categoria que a IA mais atribuiu aos artigos dela. */
export async function categoriaDaColecao(
  supabase: SupabaseClient,
  topicoId: string,
  nome: string,
): Promise<string | null> {
  const peloNome = CATEGORIAS.find((c) => normalizar(c) === normalizar(nome));
  if (peloNome) return peloNome;

  const { data: fontes } = await supabase.from("sources").select("url").eq("topic_id", topicoId);
  const urls = (fontes ?? []).map((f) => f.url as string);
  if (urls.length > 0) {
    const { data: doCatalogo } = await supabase.from("feed_catalog").select("category").in("url", urls);
    const categoria = maisFrequente((doCatalogo ?? []).map((c) => c.category as string));
    if (categoria) return categoria;
  }

  const { data: artigos } = await supabase
    .from("articles")
    .select("category, sources!inner(topic_id)")
    .eq("sources.topic_id", topicoId)
    .not("category", "is", null)
    .limit(200);
  const categoria = maisFrequente((artigos ?? []).map((a) => a.category as string));
  return categoria && categoria !== "Outros" ? categoria : null;
}

/** Feeds do catálogo que o usuário ainda não segue. Com `somenteCategoria`,
 * só os da categoria pedida (recomendação de uma coleção); sem, a
 * categoria vem primeiro e o resto completa a lista. */
export async function buscarSugestoes(
  supabase: SupabaseClient,
  categoria: string | null | undefined,
  { limite = 4, somenteCategoria = false } = {},
): Promise<Sugestao[]> {
  if (somenteCategoria && !categoria) return [];
  const [{ data: catalogo }, { data: seguidas }] = await Promise.all([
    supabase.from("feed_catalog").select("id, name, url, description, category").order("name"),
    supabase.from("sources").select("url"),
  ]);
  const urls = new Set((seguidas ?? []).map((s) => s.url as string));
  const livres = (catalogo ?? []).filter((c) => !urls.has(c.url));
  const daCategoria = livres.filter((c) => c.category === categoria);
  const ordenadas = somenteCategoria
    ? daCategoria
    : [...daCategoria, ...livres.filter((c) => c.category !== categoria)];
  return ordenadas.slice(0, limite).map((c) => ({
    id: c.id,
    nome: c.name,
    host: hostDe(c.url),
    descricao: c.description,
    categoria: c.category,
  }));
}

/** Não lidos (janela de 30 dias, via view unread_counts) de um conjunto de fontes — ou de todas. */
export async function contarNaoLidos(supabase: SupabaseClient, fonteIds?: string[]) {
  let consulta = supabase.from("unread_counts").select("nao_lidos");
  if (fonteIds) {
    if (fonteIds.length === 0) return 0;
    consulta = consulta.in("source_id", fonteIds);
  }
  const { data } = await consulta;
  return (data ?? []).reduce((soma, c) => soma + (c.nao_lidos as number), 0);
}

export function categoriasPredominantes(artigos: ArtigoLista[], limite = 2) {
  const contagem = new Map<string, number>();
  for (const a of artigos) {
    if (a.category) contagem.set(a.category, (contagem.get(a.category) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([c]) => c);
}

export async function artigosNaUltimaSemana(supabase: SupabaseClient, fonteId: string) {
  const umaSemanaAtras = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_id", fonteId)
    .gte("collected_at", umaSemanaAtras);
  return count ?? 0;
}
