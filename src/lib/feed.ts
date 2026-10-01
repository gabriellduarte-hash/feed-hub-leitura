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
  lido: boolean;
  salvo: boolean;
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

export type FiltroArtigos = {
  fonteId?: string;
  topicoId?: string;
  ids?: string[];
  busca?: string;
  limite?: number;
};

/** Busca artigos (RLS garante que só vêm os do usuário) já com o nome
 * da fonte, tempo relativo e os estados lido/salvo do usuário. */
export async function buscarArtigos(
  supabase: SupabaseClient,
  filtro: FiltroArtigos = {},
): Promise<ArtigoLista[]> {
  let consulta = supabase
    .from("articles")
    .select(SELECT_ARTIGO)
    .order("collected_at", { ascending: false })
    .limit(filtro.limite ?? 60);

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
      lido: setLidos.has(l.id),
      salvo: setSalvos.has(l.id),
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

/** Agrupa por dia: Hoje / Ontem / Esta semana / Mais antigos (como a Feedly). */
export function agruparPorDia(artigos: ArtigoLista[]): Secao[] {
  const hoje = diaLocal(new Date());
  const ontem = diaLocal(new Date(Date.now() - 86400000));
  const semana = diaLocal(new Date(Date.now() - 7 * 86400000));

  const ordem = ["Hoje", "Ontem", "Esta semana", "Mais antigos"];
  const grupos = new Map<string, ArtigoLista[]>();
  for (const artigo of artigos) {
    const dia = artigo.dia;
    const titulo =
      dia === hoje ? "Hoje" : dia === ontem ? "Ontem" : dia >= semana ? "Esta semana" : "Mais antigos";
    if (!grupos.has(titulo)) grupos.set(titulo, []);
    grupos.get(titulo)!.push(artigo);
  }
  return ordem.filter((t) => grupos.has(t)).map((t) => ({ titulo: t, artigos: grupos.get(t)! }));
}

export function agruparPorFonte(artigos: ArtigoLista[]): Secao[] {
  const grupos = new Map<string, ArtigoLista[]>();
  for (const a of artigos) {
    if (!grupos.has(a.fonteNome)) grupos.set(a.fonteNome, []);
    grupos.get(a.fonteNome)!.push(a);
  }
  return [...grupos.entries()].map(([titulo, artigos]) => ({ titulo, artigos }));
}

const CATEGORIAS = [
  "Tecnologia", "Finanças", "Humor", "Política", "Ciência",
  "Saúde", "Esportes", "Entretenimento", "Mundo", "Outros",
];

export function agruparPorCategoria(artigos: ArtigoLista[]): Secao[] {
  const grupos = new Map<string, ArtigoLista[]>();
  for (const a of artigos) {
    const chave = a.category ?? "Aguardando resumo";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(a);
  }
  return [...CATEGORIAS, "Aguardando resumo"]
    .filter((c) => grupos.has(c))
    .map((c) => ({
      titulo: c === "Aguardando resumo" ? c : `Destaques em ${c}`,
      artigos: grupos.get(c)!,
    }));
}

export type Sugestao = { id: string; nome: string; host: string; descricao: string | null; categoria: string };

/** "Você também pode gostar": feeds do catálogo que o usuário ainda não segue. */
export async function buscarSugestoes(
  supabase: SupabaseClient,
  categoria?: string | null,
  limite = 3,
): Promise<Sugestao[]> {
  const [{ data: catalogo }, { data: seguidas }] = await Promise.all([
    supabase.from("feed_catalog").select("id, name, url, description, category"),
    supabase.from("sources").select("url"),
  ]);
  const urls = new Set((seguidas ?? []).map((s) => s.url as string));
  const livres = (catalogo ?? []).filter((c) => !urls.has(c.url));
  const ordenadas = [
    ...livres.filter((c) => c.category === categoria),
    ...livres.filter((c) => c.category !== categoria),
  ];
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
