import { XMLParser } from "fast-xml-parser";
import { decodificarEntidades, htmlParaTexto, limparTexto, MAX_CARACTERES } from "./limpar-texto";

/** Mesmo User-Agent do coletor em Python (coletor/coletar.py). */
export const USER_AGENT = "FeedNoticiasBot/0.1 (uso pessoal - estudo)";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECIONAMENTOS = 4;
export const MAX_NOTICIAS = 20;

export type Noticia = {
  title: string;
  url: string;
  content: string | null;
  published_at: string | null;
  author: string | null;
  image_url: string | null;
};

/* ----------------------------------------------------------------------- */
/* Busca segura                                                            */
/* ----------------------------------------------------------------------- */

// O servidor vai abrir links digitados pelo usuário. Sem isso, alguém
// poderia pedir "http://localhost:..." ou um IP da rede interna da
// hospedagem e usar o hub pra acessar o que não devia (SSRF).
function hostPermitido(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (host.startsWith("[")) return false; // IPv6 literal: sem caso de uso legítimo aqui
  const ip = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return false;
    }
  }
  return true;
}

export class ErroBusca extends Error {}

/** fetch com timeout, limite de tamanho e checagem de host a cada redirecionamento. */
export async function buscar(endereco: string): Promise<{ url: string; tipo: string; texto: string }> {
  let atual = new URL(endereco);
  for (let i = 0; i <= MAX_REDIRECIONAMENTOS; i++) {
    if (!hostPermitido(atual)) throw new ErroBusca("endereço não permitido");
    const resposta = await fetch(atual, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8" },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (resposta.status >= 300 && resposta.status < 400 && resposta.headers.get("location")) {
      atual = new URL(resposta.headers.get("location")!, atual);
      continue;
    }
    if (!resposta.ok) throw new ErroBusca(`HTTP ${resposta.status}`);
    const tamanho = Number(resposta.headers.get("content-length") ?? 0);
    if (tamanho > MAX_BYTES) throw new ErroBusca("resposta grande demais");
    const bytes = await resposta.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) throw new ErroBusca("resposta grande demais");
    return {
      url: atual.toString(),
      tipo: resposta.headers.get("content-type") ?? "",
      texto: new TextDecoder("utf-8").decode(bytes),
    };
  }
  throw new ErroBusca("redirecionamentos demais");
}

/* ----------------------------------------------------------------------- */
/* Texto                                                                   */
/* ----------------------------------------------------------------------- */

export function limparHtml(valor: unknown, limite?: number): string {
  let texto = decodificarEntidades(textoDe(valor).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (limite && texto.length > limite) texto = texto.slice(0, limite);
  return texto;
}

/** O texto mais completo que o feed manda, limpo e com os parágrafos.
 * Muitos feeds (WordPress) põem a matéria inteira no content:encoded e
 * só uma frase no description; outros (G1) põem tudo no description. */
function textoDaNoticia(...candidatos: unknown[]): string | null {
  const textos = candidatos.map((c) => limparTexto(htmlParaTexto(textoDe(c))));
  const melhor = textos.reduce((a, b) => (b.length > a.length ? b : a), "");
  return melhor.slice(0, MAX_CARACTERES) || null;
}

function textoDe(valor: unknown): string {
  if (valor == null) return "";
  if (typeof valor === "string" || typeof valor === "number") return String(valor);
  if (Array.isArray(valor)) return textoDe(valor[0]);
  if (typeof valor === "object" && "#text" in valor) return textoDe((valor as Record<string, unknown>)["#text"]);
  return "";
}

function data(valor: unknown): string | null {
  const texto = textoDe(valor).trim();
  if (!texto) return null;
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function tituloSemSite(titulo: string) {
  return titulo.replace(/\s+-\s+[^-]{1,60}$/, "").trim() || titulo;
}

/* ----------------------------------------------------------------------- */
/* XML: RSS 2.0, Atom, RSS 1.0 (RDF) e sitemap de notícias                 */
/* ----------------------------------------------------------------------- */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (nome) =>
    ["item", "entry", "url", "sitemap", "link", "media:content", "media:thumbnail", "enclosure", "category"].includes(nome),
  processEntities: true,
  htmlEntities: true,
});

export function pareceXml(tipo: string, texto: string) {
  const inicio = texto.trimStart().slice(0, 300).toLowerCase();
  return /xml|rss|atom/.test(tipo.toLowerCase()) || inicio.startsWith("<?xml") || inicio.startsWith("<rss") || inicio.startsWith("<feed") || inicio.startsWith("<rdf");
}

type No = Record<string, unknown>;

function primeiraImagem(item: No): string | null {
  for (const chave of ["media:thumbnail", "media:content"]) {
    const lista = item[chave] as No[] | undefined;
    const achado = lista?.find((m) => m["@_url"] && (chave === "media:thumbnail" || String(m["@_medium"] ?? m["@_type"] ?? "image").startsWith("image")));
    if (achado) return String(achado["@_url"]);
  }
  const anexo = (item.enclosure as No[] | undefined)?.find((e) => String(e["@_type"] ?? "").startsWith("image/"));
  if (anexo?.["@_url"]) return String(anexo["@_url"]);
  const html = textoDe(item["content:encoded"]) || textoDe(item.description) || textoDe(item.summary) || textoDe(item.content);
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function linkAtom(item: No): string {
  const links = (item.link as (No | string)[] | undefined) ?? [];
  for (const l of links) {
    if (typeof l === "string") return l;
    if (!l["@_rel"] || l["@_rel"] === "alternate") return String(l["@_href"] ?? "");
  }
  return "";
}

export type FeedLido = {
  formato: "rss" | "atom" | "sitemap" | "indice-sitemap";
  titulo: string | null;
  noticias: Noticia[];
  /** RSS do Google Notícias: site de origem de cada item (pra filtrar). */
  origens: string[];
  /** Índice de sitemap: endereços dos sitemaps filhos, mais novos primeiro. */
  filhos: string[];
};

export function lerXml(texto: string): FeedLido | null {
  let raiz: No;
  try {
    raiz = parser.parse(texto) as No;
  } catch {
    return null;
  }

  const rss = (raiz.rss as No | undefined)?.channel as No | undefined;
  const rdf = raiz["rdf:RDF"] as No | undefined;
  if (rss || rdf) {
    const canal = (rss ?? (rdf?.channel as No)) ?? {};
    const itens = ((rss ? rss.item : rdf?.item) as No[] | undefined) ?? [];
    return {
      formato: "rss",
      titulo: limparHtml(canal.title) || null,
      noticias: itens.map((i) => ({
        title: limparHtml(i.title) || "(sem título)",
        url: textoDe(i.link).trim() || textoDe(i.guid).trim(),
        content: textoDaNoticia(i["content:encoded"], i.description),
        published_at: data(i.pubDate ?? i["dc:date"]),
        author: limparHtml(i["dc:creator"] ?? i.author) || null,
        image_url: primeiraImagem(i),
      })),
      origens: itens.map((i) => String((i.source as No | undefined)?.["@_url"] ?? "")),
      filhos: [],
    };
  }

  const atom = raiz.feed as No | undefined;
  if (atom) {
    const itens = (atom.entry as No[] | undefined) ?? [];
    return {
      formato: "atom",
      titulo: limparHtml(atom.title) || null,
      noticias: itens.map((i) => ({
        title: limparHtml(i.title) || "(sem título)",
        url: linkAtom(i),
        content: textoDaNoticia(i.content, i.summary),
        published_at: data(i.published ?? i.updated),
        author: limparHtml((i.author as No | undefined)?.name) || null,
        image_url: primeiraImagem(i),
      })),
      origens: [],
      filhos: [],
    };
  }

  const urlset = raiz.urlset as No | undefined;
  if (urlset) {
    const urls = (urlset.url as No[] | undefined) ?? [];
    return {
      formato: "sitemap",
      titulo: null,
      noticias: urls
        .map((u) => {
          const news = u["news:news"] as No | undefined;
          return {
            title: limparHtml(news?.["news:title"]),
            url: textoDe(u.loc).trim(),
            content: null,
            published_at: data(news?.["news:publication_date"] ?? u.lastmod),
            author: null,
            image_url: textoDe((u["image:image"] as No | undefined)?.["image:loc"]).trim() || null,
          };
        })
        .filter((n) => n.title && n.url), // sitemap comum (sem news:title) não serve
      origens: [],
      filhos: [],
    };
  }

  const indice = raiz.sitemapindex as No | undefined;
  if (indice) {
    const filhos = ((indice.sitemap as No[] | undefined) ?? [])
      .map((s) => ({ loc: textoDe(s.loc).trim(), quando: textoDe(s.lastmod) }))
      .filter((s) => s.loc)
      .sort((a, b) => b.quando.localeCompare(a.quando))
      .map((s) => s.loc);
    return { formato: "indice-sitemap", titulo: null, noticias: [], origens: [], filhos };
  }
  return null;
}

/* ----------------------------------------------------------------------- */
/* Coleta por tipo de fonte                                                */
/* ----------------------------------------------------------------------- */

function maisRecentes(noticias: Noticia[]) {
  const vistas = new Set<string>();
  return noticias
    .filter((n) => n.url && !vistas.has(n.url) && vistas.add(n.url))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, MAX_NOTICIAS);
}

export function ehGoogleNews(url: string) {
  return url.startsWith("https://news.google.com/");
}

/** Mesmo formato do coletor em Python (alternativas.url_google_news), pra
 * a URL bater com a do catálogo quando é o mesmo site. */
export function urlGoogleNews(urlSite: string) {
  const u = new URL(urlSite);
  const alvo = u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "");
  const q = encodeURIComponent(`site:${alvo}`).replace(/%2F/g, "/");
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

function semWww(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

/** Notícias de um RSS/Atom. No Google Notícias, só as do site pedido. */
export async function lerFeed(url: string): Promise<{ lido: FeedLido; noticias: Noticia[] } | null> {
  const { texto } = await buscar(url);
  const lido = lerXml(texto);
  if (!lido || (lido.formato !== "rss" && lido.formato !== "atom")) return null;
  let noticias = lido.noticias;
  if (ehGoogleNews(url)) {
    // Só as do próprio site: domínio igual, ignorando "www." — a busca
    // "site:" também traz subdomínios (ex.: o fórum forum.adrenaline.com.br)
    const site = semWww((new URL(url).searchParams.get("q") ?? "").replace(/^site:/, "").split("/")[0]);
    noticias = noticias
      .filter((_, i) => (lido.origens[i] ? semWww(new URL(lido.origens[i]).hostname) === site : false))
      .map((n) => ({ ...n, title: tituloSemSite(n.title), content: null }));
  }
  return { lido, noticias: maisRecentes(noticias) };
}

/** Notícias de um sitemap de notícias (ou índice), com o filtro "#caminho=". */
export async function lerSitemap(url: string): Promise<Noticia[]> {
  const [endereco, fragmento] = url.split("#");
  const caminho = new URLSearchParams(fragmento ?? "").get("caminho");
  const { texto } = await buscar(endereco);
  const lido = lerXml(texto);
  if (!lido) return [];
  let noticias = lido.noticias;
  if (lido.formato === "indice-sitemap") {
    const filhos = await Promise.allSettled(lido.filhos.slice(0, 3).map(async (f) => lerXml((await buscar(f)).texto)));
    noticias = filhos.flatMap((r) => (r.status === "fulfilled" && r.value ? r.value.noticias : []));
  }
  if (caminho) noticias = noticias.filter((n) => new URL(n.url).pathname.startsWith(caminho));
  return maisRecentes(noticias);
}

/** Página avulsa (tipo "scrape"): um artigo só, com os metadados da página. */
export async function lerPagina(url: string): Promise<Noticia[]> {
  const { url: final, texto } = await buscar(url);
  const meta = (prop: string) =>
    texto.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1] ??
    texto.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i"))?.[1];
  const titulo = limparHtml(meta("og:title") ?? texto.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
  if (!titulo) return [];
  return [
    {
      title: titulo,
      url: final,
      content: limparHtml(meta("og:description") ?? meta("description"), 4000) || null,
      published_at: data(meta("article:published_time")),
      author: limparHtml(meta("author")) || null,
      image_url: meta("og:image") ?? null,
    },
  ];
}

export async function coletarFonte(url: string, tipo: string): Promise<Noticia[]> {
  if (tipo === "sitemap") return lerSitemap(url);
  if (tipo === "scrape") return lerPagina(url);
  let noticias: Noticia[] = [];
  try {
    noticias = (await lerFeed(url))?.noticias ?? [];
  } catch {
    // cai no plano B abaixo
  }
  // Plano B, igual ao coletor em Python: alguns sites (ex.: Adrenaline)
  // respondem 403 pra servidores de nuvem, inclusive a Vercel. O Google
  // Notícias do mesmo site não depende do site responder.
  if (noticias.length === 0 && !ehGoogleNews(url)) {
    const u = new URL(url);
    noticias = (await lerFeed(urlGoogleNews(`${u.protocol}//${u.host}`)).catch(() => null))?.noticias ?? [];
  }
  return noticias;
}
