import type { SupabaseClient } from "@supabase/supabase-js";
import { hostDe } from "./fonte";
import {
  buscar,
  lerFeed,
  lerPagina,
  lerSitemap,
  limparHtml,
  pareceXml,
  urlGoogleNews,
} from "./leitor-feeds";

export type Via = "catalogo" | "rss" | "rss-na-pagina" | "sitemap" | "google-news" | "pagina";

export type FonteDetectada = {
  url: string;
  tipo: "rss" | "sitemap" | "scrape";
  nome: string | null;
  via: Via;
};

const CAMINHOS_COMUNS = ["/feed", "/feed/", "/rss", "/rss.xml", "/feed.xml", "/atom.xml", "/index.xml"];

export function normalizarEntrada(entrada: string): URL | null {
  const texto = entrada.trim();
  if (!texto) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Nome do site: og:site_name, senão o pedaço do <title> que tem o nome
 * do domínio ("Tudo sobre cinema... | Omelete" -> "Omelete"). */
function nomeDaPagina(html: string, url: string) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (og) return limparHtml(og) || null;
  const titulo = limparHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
  if (!titulo) return null;
  const rotulo = new URL(url).hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
  const partes = titulo.split(/\s[|\-–—:]\s/).map((p) => p.trim()).filter(Boolean);
  const semEspaco = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "").toLowerCase();
  return partes.find((p) => semEspaco(p).includes(rotulo)) ?? partes[0] ?? null;
}

function feedsDeclarados(html: string, base: string) {
  const links = html.match(/<link[^>]+>/gi) ?? [];
  return links
    .filter((l) => /rel=["'][^"']*alternate/i.test(l) && /type=["']application\/(rss|atom)\+xml/i.test(l))
    .map((l) => l.match(/href=["']([^"']+)["']/i)?.[1])
    .filter((h): h is string => !!h)
    .map((h) => new URL(h, base).toString());
}

async function feedValido(url: string) {
  try {
    const r = await lerFeed(url);
    return r && r.noticias.length > 0 ? r : null;
  } catch {
    return null;
  }
}

async function sitemapsDeNoticia(site: URL): Promise<string[]> {
  const base = `${site.protocol}//${site.host}`;
  let declarados: string[] = [];
  try {
    const { texto } = await buscar(`${base}/robots.txt`);
    declarados = texto
      .split(/\r?\n/)
      .filter((l) => /^sitemap:/i.test(l))
      .map((l) => l.slice(l.indexOf(":") + 1).trim())
      .filter((s) => /news|noticia/i.test(s));
  } catch {
    // sem robots.txt: tenta só os caminhos comuns
  }
  return [...new Set([...declarados, `${base}/news-sitemap.xml`, `${base}/sitemap-news.xml`])];
}

/** Descobre como ler o link que o usuário colou. Ordem:
 * 1. já está no catálogo (mesma URL, ou página inicial do mesmo site)? usa de lá;
 * 2. o próprio link é um feed?
 * 3. a página declara um feed (<link rel="alternate">)?  ou está num caminho comum (/feed)?
 * 4. o site tem sitemap de notícias?
 * 5. o Google Notícias tem notícias desse site?
 * 6. senão, guarda como página avulsa. */
export async function detectarFonte(
  supabase: SupabaseClient,
  entrada: string,
): Promise<{ fonte?: FonteDetectada; erro?: string; catalogoId?: string }> {
  const url = normalizarEntrada(entrada);
  if (!url) return { erro: "Esse endereço não parece válido. Tente algo como tecmundo.com.br" };
  const ehPaginaInicial = url.pathname.replace(/\/+$/, "") === "";

  // 1) catálogo
  const { data: catalogo } = await supabase.from("feed_catalog").select("id, name, url, kind");
  const doCatalogo =
    catalogo?.find((c) => c.url === url.toString() || c.url === entrada.trim()) ??
    (ehPaginaInicial ? catalogo?.find((c) => hostDe(c.url) === hostDe(url.toString())) : undefined);
  if (doCatalogo) {
    return {
      catalogoId: doCatalogo.id,
      fonte: {
        url: doCatalogo.url,
        tipo: doCatalogo.kind === "sitemap" ? "sitemap" : "rss",
        nome: doCatalogo.name,
        via: "catalogo",
      },
    };
  }

  // 2) o link já é um feed?
  let pagina: { url: string; tipo: string; texto: string } | null = null;
  try {
    pagina = await buscar(url.toString());
  } catch {
    // site bloqueando robôs ou fora do ar: ainda dá pra tentar o Google Notícias
  }

  if (pagina && pareceXml(pagina.tipo, pagina.texto)) {
    const feed = await feedValido(pagina.url);
    if (feed) return { fonte: { url: pagina.url, tipo: "rss", nome: feed.lido.titulo, via: "rss" } };
    const sitemap = await lerSitemap(pagina.url).catch(() => []);
    if (sitemap.length > 0) return { fonte: { url: pagina.url, tipo: "sitemap", nome: null, via: "sitemap" } };
  }

  const nomeSite = pagina ? nomeDaPagina(pagina.texto, pagina.url) : null;

  // 3) feed declarado na página, ou em caminho comum. Os caminhos comuns
  // valem mesmo se a página não abriu: há sites que barram o robô na
  // página inicial (anti-bot), mas deixam o /feed aberto (ex.: Tecnoblog).
  const base = new URL(pagina?.url ?? url.toString());
  const candidatos = [
    ...(pagina ? feedsDeclarados(pagina.texto, pagina.url) : []),
    ...CAMINHOS_COMUNS.map((c) => `${base.protocol}//${base.host}${c}`),
  ];
  for (const candidato of [...new Set(candidatos)]) {
    const feed = await feedValido(candidato);
    if (feed) {
      return { fonte: { url: candidato, tipo: "rss", nome: nomeSite ?? feed.lido.titulo, via: "rss-na-pagina" } };
    }
  }

  // 4) sitemap de notícias (filtrando a seção, se o link apontou pra uma;
  // se o link era de um feed que não abriu, vale o site inteiro)
  const alvo = /(^|\/)(feeds?|rss|atom)(\/|$)|\.(xml|rss|atom|cms)$/i.test(url.pathname) ? new URL(url.origin) : url;
  const caminho = alvo.pathname.replace(/\/+$/, "");
  for (const sitemap of await sitemapsDeNoticia(alvo)) {
    const endereco = sitemap + (caminho ? `#caminho=${caminho}` : "");
    const noticias = await lerSitemap(endereco).catch(() => []);
    if (noticias.length > 0) return { fonte: { url: endereco, tipo: "sitemap", nome: nomeSite, via: "sitemap" } };
  }

  // 5) Google Notícias
  const google = urlGoogleNews(alvo.toString());
  const feed = await feedValido(google);
  if (feed) return { fonte: { url: google, tipo: "rss", nome: nomeSite, via: "google-news" } };

  // 6) página avulsa
  if (pagina) {
    const artigo = await lerPagina(pagina.url).catch(() => []);
    if (artigo.length > 0) return { fonte: { url: pagina.url, tipo: "scrape", nome: nomeSite, via: "pagina" } };
  }
  return { erro: "Não encontramos notícias nesse site. Confira o endereço ou tente a página inicial dele." };
}
