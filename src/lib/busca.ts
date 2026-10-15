import { normalizarChave } from "./seguir";

/* Busca que perdoa singular/plural e acento: "serie" acha "séries",
 * "filmes" acha "filme", "eleicao" acha "eleições". As notícias têm a
 * coluna `busca` (título + começo do texto, minúsculas, sem acento,
 * sql/047); aqui cada palavra vira uma expressão regular do Postgres com
 * as formas dela. Os temas são comparados pelo radical (mesma regra do
 * coletor, sinais.radical). */

const PALAVRAS_VAZIAS = new Set(
  "a o as os um uma de da do das dos em na no nas nos por pela pelo para pra com e ou que se the of and to in on for".split(" "),
);

/** A mesma forma pro singular e o plural (igual a sinais.radical no
 * coletor): "filmes" e "filme" -> "film"; "eleicoes" -> "eleicao". */
export function radical(palavra: string) {
  const p = palavra;
  if (p.length <= 3 || !/^[a-z]+$/.test(p)) return p;
  for (const [fim, troca] of [["oes", "ao"], ["aes", "ao"], ["aos", "ao"]]) {
    if (p.endsWith(fim)) return p.slice(0, -fim.length) + troca;
  }
  for (const [fim, troca] of [["ais", "al"], ["eis", "el"], ["ois", "ol"], ["uis", "ul"]]) {
    if (p.endsWith(fim) && p.length > 4) return p.slice(0, -fim.length) + troca;
  }
  if (p.endsWith("ns")) return p.slice(0, -2) + "m";
  if (p.endsWith("es") && p.length > 4) return p.slice(0, -2);
  if (p.endsWith("e")) return p.slice(0, -1);
  if (p.endsWith("s") && !p.endsWith("ss") && !p.endsWith("us") && !p.endsWith("is")) return p.slice(0, -1);
  return p;
}

/** As palavras que contam numa busca: sem acento, sem "de", "da", "the". */
export function palavrasDaBusca(texto: string) {
  return normalizarChave(texto)
    .split(" ")
    .filter((p) => p.length >= 2 && !PALAVRAS_VAZIAS.has(p))
    .slice(0, 6);
}

/** Expressão regular (Postgres) que acha a palavra inteira no singular ou
 * no plural. Com `prefixo`, vale também o começo dela (pra quem ainda está
 * digitando: "flamen" acha "flamengo"). */
export function expressaoDaPalavra(palavra: string, prefixo = false) {
  const r = radical(palavra);
  const formas = new Set([palavra, r, `${r}e`, `${r}es`, `${r}s`]);
  if (r.endsWith("ao")) {
    const base = r.slice(0, -2);
    for (const fim of ["oes", "aes", "aos"]) formas.add(base + fim);
  }
  for (const [s, plural] of [["al", "ais"], ["el", "eis"], ["ol", "ois"], ["ul", "uis"]]) {
    if (r.endsWith(s)) formas.add(r.slice(0, -2) + plural);
  }
  if (r.endsWith("m")) formas.add(`${r.slice(0, -1)}ns`);
  const alternativas = [...formas].filter((f) => /^[a-z0-9]+$/.test(f)).sort((a, b) => b.length - a.length);
  if (prefixo) alternativas.push(`${palavra}[a-z0-9]*`);
  return `\\m(${alternativas.join("|")})\\M`;
}

/** O texto (um tema e seus sinônimos) tem todas as palavras da busca? A
 * última pode estar pela metade (quem digita "quadr" já vê Quadrinhos). */
export function combina(textos: string[], palavras: string[]) {
  if (palavras.length === 0) return false;
  const alvo = textos.flatMap((t) => normalizarChave(t).split(" ")).filter(Boolean);
  const radicais = new Set(alvo.map(radical));
  return palavras.every(
    (p, i) => radicais.has(radical(p)) || (i === palavras.length - 1 && p.length >= 2 && alvo.some((a) => a.startsWith(p))),
  );
}
