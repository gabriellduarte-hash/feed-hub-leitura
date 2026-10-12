/* A mesma notícia por dois caminhos: o feed do site (link direto, com
 * texto) e o plano B do Google Notícias (link do Google, só o título).
 * Os títulos nem sempre são iguais (o Google usa o título da página; o
 * feed, a manchete), então a comparação é pelas palavras principais: se
 * quase todas as da manchete mais curta estão na outra, é a mesma.
 * Mesma regra do coletor (coletor/manchetes.py). */

const PALAVRAS_FRACAS = new Set([
  "and", "com", "das", "dos", "for", "mas", "nas", "nos", "num", "para", "pela", "pelo",
  "por", "que", "sem", "sob", "sua", "seu", "the", "uma", "with",
]);
const MIN_PALAVRAS = 5; // manchete curta demais não dá pra comparar com segurança
const SOBREPOSICAO_MINIMA = 0.8;
export const DIAS_PRA_COMPARAR = 3;

export function ehLinkDoGoogle(url: string | null | undefined) {
  return (url ?? "").startsWith("https://news.google.com/");
}

function palavras(titulo: string) {
  const semAcento = titulo.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase();
  return new Set(semAcento.split(/[^a-z0-9]+/).filter((p) => p.length >= 3 && !PALAVRAS_FRACAS.has(p)));
}

export function mesmaManchete(a: string, b: string) {
  const pa = palavras(a);
  const pb = palavras(b);
  if (pa.size === 0 || pb.size === 0) return false;
  const comuns = [...pa].filter((p) => pb.has(p)).length;
  if (comuns === pa.size && comuns === pb.size) return true;
  const menor = Math.min(pa.size, pb.size);
  return menor >= MIN_PALAVRAS && comuns / menor >= SOBREPOSICAO_MINIMA;
}

type ComTitulo = { url: string; title: string };

/** existentes: notícias recentes do mesmo feed. Devolve o que inserir e o
 * que promover: a do Google que repete uma que já existe fica de fora; a
 * direta que repete uma do Google promove a do Google (ganha o link, o
 * texto e a foto, e mantém o id, então "lido" e "salvo" continuam). */
export function separarRepetidas<N extends ComTitulo>(existentes: (ComTitulo & { id: string })[], novas: N[]) {
  const inserir: N[] = [];
  const promover: [string, N][] = [];
  const doGoogle = existentes.filter((e) => ehLinkDoGoogle(e.url));
  const jaPromovidas = new Set<string>();
  for (const nova of novas) {
    if (ehLinkDoGoogle(nova.url)) {
      if (existentes.some((e) => mesmaManchete(nova.title, e.title))) continue;
    } else {
      const alvo = doGoogle.find((e) => !jaPromovidas.has(e.id) && mesmaManchete(nova.title, e.title));
      if (alvo) {
        jaPromovidas.add(alvo.id);
        promover.push([alvo.id, nova]);
        continue;
      }
    }
    inserir.push(nova);
  }
  return { inserir, promover };
}
