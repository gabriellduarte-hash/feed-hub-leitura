/** Limpeza do texto das notícias: tudo o que não é a matéria sai.
 * Anúncio ("Publicidade", "Continua depois da publicidade"), aviso de
 * cookies, "siga no WhatsApp", pedido de assinatura, aviso de link de
 * afiliado, botões de comentário, crédito de imagem solto, rodapé do
 * WordPress ("The post ... appeared first on ...").
 *
 * São as mesmas regras fixas do coletor (coletor/texto.py, no repositório
 * do coletor): mudou uma, muda a outra. Lá também há a regra dos trechos
 * que o site repete em toda matéria, que precisa do banco.
 *
 * Usado ao coletar na hora de adicionar uma fonte (leitor-feeds.ts) e na
 * exibição (leitor e prévia da lista), pro que já estava gravado. */

export const MAX_CARACTERES = 12000;

// "simbÃ³lico" -> "simbólico": texto em UTF-8 que alguém leu como Latin-1
// ou Windows-1252 (página sem a codificação no cabeçalho, como a Folha).
// Cada trecho estragado volta a ser os bytes originais e é lido de novo
// como UTF-8; o que não for UTF-8 válido fica como está. Mesma ideia do
// ftfy.fix_encoding do coletor.
const CP1252: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a,
  "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};
const CONTINUACAO = "[\\u0080-\\u00BF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]";
const TEM_ESTRAGO = new RegExp(`[\\u00C2-\\u00F4]${CONTINUACAO}`);
const TRECHO_ESTRAGADO = new RegExp(`[\\u00C2-\\u00F4]${CONTINUACAO}{1,3}`, "g");

export function consertarAcentos(texto: string): string;
export function consertarAcentos(texto: string | null | undefined): string | null | undefined;
export function consertarAcentos(texto: string | null | undefined) {
  if (!texto || !TEM_ESTRAGO.test(texto)) return texto;
  return texto.replace(TRECHO_ESTRAGADO, (trecho) => {
    const bytes = [...trecho].map((c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : CP1252[c]));
    if (bytes.some((b) => b === undefined)) return trecho;
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes as number[]));
    } catch {
      return trecho;
    }
  });
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodificarEntidades(texto: string) {
  return texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (inteiro, codigo: string) => {
    if (codigo[0] === "#") {
      const n = codigo[1].toLowerCase() === "x" ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : inteiro;
    }
    return ENTIDADES[codigo.toLowerCase()] ?? inteiro;
  });
}

// Parágrafo inteiro que é só rótulo de anúncio, navegação, botão ou crédito
const ROTULOS = new RegExp(
  "^(publicidade|an[uú]ncio|propaganda|patrocinado( por)?|conte[uú]do (patrocinado|de marca|pago)" +
    "|continua (depois|ap[oó]s) (d?a )?publicidade|leia (mais|tamb[eé]m|a seguir|mais sobre)" +
    "|veja (tamb[eé]m|mais)|saiba mais|confira( tamb[eé]m)?|tudo sobre|mais lidas?|relacionad[ao]s?" +
    "|ver (na|no) amazon.*|ver (esse|este) post no instagram" +
    "|(excluir|editar|responder|denunciar) coment[aá]rio|confirmar a exclus[aã]o do coment[aá]rio" +
    "|compartilhe|compartilhar|imprimir|copiar link|republicar|me registro" +
    "|(rep[oó]rter|redator|redatora|colaborador|colaboradora|freelancer|editor|editora)( de [\\p{L}\\d ,]{1,60})?" +
    "|(reprodu[cç][aã]o|divulga[cç][aã]o)(\\s*[/|-].{0,40})?|(foto|imagem|cr[eé]dito)s?\\s*[:/-].{0,60}" +
    // em inglês (fontes de fora)
    "|advertisement|sponsored( content)?|story continues below( advertisement)?|read more|related( stories| articles| coverage)?" +
    "|recommended( stories| for you)?|more from .{1,40}|share this (article|story)|(photo|image)( credit)?\\s*[:/-].{0,60}" +
    "|getty images|(sign up|subscribe)( now| today)?)" +
    "[\\s:.?!→»>-]*$",
  "iu",
);
const DATAS_DE_PUBLICACAO = /^((publicado|modificado|atualizado) em:?\s*(\d[\d/:h, -]{0,25})?\s*)+$/i;
const DATA_SOLTA = /^\d{1,2} de [a-zç]+ de \d{4}(\s*[-–,às]+\s*\d{1,2}[:h]\d{2})?$/i;
const TEMPLATE = /^\{[{%].*[}%]\}$/;
const INSTAGRAM = /^(ver (esse|este) post no instagram\s*)?um post compartilhado por .{1,80}\(@[\p{L}\d_.]+\)$/iu;
// Chamadas e avisos: só em parágrafo curto, pra não apagar uma notícia
// que fale de cookies, newsletter ou WhatsApp
const CHAMADAS = new RegExp(
  "\\bcookies?\\b|pol[ií]tica de privacidade" +
    "|\\b(siga|acompanhe|inscreva-se)\\b.{0,60}\\b(whatsapp|instagram|telegram|google (news|not[ií]cias)|youtube|tiktok|facebook|twitter|threads|bluesky)\\b" +
    "|(whatsapp|telegram).{0,80}\\b(siga|canal|participe|grupo)\\b|\\b(siga|canal|participe|grupo)\\b.{0,80}(whatsapp|telegram)" +
    "|participe do (nosso )?canal|inscreva-se|newsletter" +
    "|\\breceba\\b.{0,40}\\b(not[ií]cias|newsletters?|alertas)\\b" +
    "|\\bassine\\b|contribua com|apoie o jornalismo" +
    "|(afiliad[oa]s?|parceiros)\\b.{0,120}\\b(comiss|porcentagem)|\\b(comiss[aã]o|porcentagem)\\b.{0,120}\\b(afiliad|parceiros)" +
    "|adicion\\p{L}*.{0,40}tela inicial|baixe (o|nosso) app|clique aqui|\\bclique e (entre|confira|saiba|acesse)\\b" +
    "|bloqueador de an[uú]ncios|\\badblock" +
    // em inglês
    "|\\b(sign up|subscribe)\\b.{0,60}\\b(newsletter|our|today|free)\\b|\\bfollow us on\\b|privacy policy|terms of (use|service)" +
    "|\\bthis (article|story) (contains|may contain) affiliate|\\bwe may (earn|receive) (a )?commission",
  "iu",
);
const CHAMADA_MAX_CARACTERES = 280;
const AVISOS =
  /\b(usamos|utilizamos|este site (usa|utiliza)) cookies\b|browser extensions? seems? to be blocking|\bwe use cookies\b|\bthis (site|website) uses cookies\b/i;
const AVISO_MAX_CARACTERES = 600;
const EMOJI_DE_CHAMADA = /^(➡️|➡|📲|👉|📢|🔔|📱)/u;
const RODAPE_WORDPRESS = /\s*\b(The post|O post)\b.{1,400}?\b(appeared first on|apareceu primeiro em)\b[^\n]{0,120}/gi;

export function ehLixo(paragrafo: string) {
  const p = paragrafo.trim();
  if ([ROTULOS, DATAS_DE_PUBLICACAO, DATA_SOLTA, TEMPLATE, INSTAGRAM].some((r) => r.test(p))) return true;
  if (p.length <= AVISO_MAX_CARACTERES && AVISOS.test(p)) return true;
  return p.length <= CHAMADA_MAX_CARACTERES && (CHAMADAS.test(p) || EMOJI_DE_CHAMADA.test(p));
}

/** Tira os parágrafos de lixo, o rodapé do WordPress e parágrafos repetidos. */
export function limparTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const linha of consertarAcentos(texto).replace(RODAPE_WORDPRESS, "").split("\n")) {
    const p = linha.replace(/\s+/g, " ").trim();
    if (!p || vistos.has(p) || ehLixo(p)) continue;
    vistos.add(p);
    saida.push(p);
  }
  return saida.join("\n");
}

// Pelo Google Notícias, a busca "site:" também traz páginas que não são
// notícia: listagens ("... - Página 1246"), páginas de pessoa ou de filme
// ("Milo Quifes") e de streaming ("Ver X online"). Mesma regra do coletor
// (alternativas.eh_noticia_do_google_news).
export function ehNoticiaDoGoogleNews(titulo: string) {
  return !(
    /(^|\s)(p[áa]gina|page)\s+\d+/i.test(titulo) ||
    /^(ver|assistir)\b.*\bonline$/i.test(titulo) ||
    titulo.trim().split(/\s+/).length < 4
  );
}

// Tags que nunca são texto da matéria (somem com o que tem dentro)
const TAGS_FORA =
  /<(script|style|noscript|iframe|form|button|svg|figure|figcaption|aside|nav|footer|header|video|audio|object|template|picture|select|textarea)\b[\s\S]*?<\/\1>/gi;
const INSTAGRAM_EMBUTIDO = /<blockquote[^>]*instagram-media[\s\S]*?<\/blockquote>/gi;
const TAGS_BLOCO = /<\/?(p|div|section|article|main|h[1-6]|ul|ol|blockquote|pre|table|tr|dl|dt|dd|hr)\b[^>]*>/gi;

/** HTML do feed -> um parágrafo por linha (o leitor monta intertítulos e
 * listas a partir disso), sem figuras, scripts e formulários. */
export function htmlParaTexto(html: string): string {
  if (!html.trim()) return "";
  const texto = decodificarEntidades(
    html
      .replace(TAGS_FORA, " ")
      .replace(INSTAGRAM_EMBUTIDO, " ")
      .replace(/<li\b[^>]*>/gi, "\n- ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(TAGS_BLOCO, "\n")
      .replace(/<[^>]+>/g, ""),
  );
  const linhas = texto
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && l !== "-");
  // <br> no meio da frase: linha em minúscula continua a anterior, se a
  // anterior não terminou a frase
  const saida: string[] = [];
  for (const linha of linhas) {
    const anterior = saida.at(-1);
    if (anterior && /^\p{Ll}/u.test(linha) && !/[.!?:;…"”)]$/.test(anterior) && !anterior.startsWith("- ")) {
      saida[saida.length - 1] = `${anterior} ${linha}`;
    } else {
      saida.push(linha);
    }
  }
  return saida.join("\n");
}
