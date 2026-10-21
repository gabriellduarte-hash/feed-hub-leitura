import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { buscar } from "./leitor-feeds";
import { htmlParaTexto, limparTexto, MAX_CARACTERES } from "./limpar-texto";

/* Abre a página de uma notícia e tira o texto (Readability, o mesmo do
 * modo leitura do Firefox), a foto de capa e o autor. Usado pelo hub nos
 * sites abertos que barram as máquinas do GitHub (/api/coletar-bloqueados).
 *
 * Regras, iguais às do coletor em Python:
 * - robots.txt: se o site não deixa o DailyPaperBot (ou todo robô) abrir
 *   aquele caminho, não abre;
 * - paywall: página que se declara paga (isAccessibleForFree: false) não
 *   tem o texto copiado, só a foto. */

const NOME_DO_ROBO = "dailypaperbot";
const cacheRobots = new Map<string, Promise<RegExp[]>>();

function regraParaRegex(caminho: string) {
  const corpo = caminho
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\\\$$/, "$");
  return new RegExp(`^${corpo}`);
}

/** Os Disallow que valem pro nosso robô: o grupo com o nome dele, ou o "*". */
function lerRobots(texto: string): RegExp[] {
  const grupos: { agentes: string[]; bloqueios: string[] }[] = [];
  let atual: { agentes: string[]; bloqueios: string[] } | null = null;
  let lendoAgentes = false;
  for (const linhaBruta of texto.split("\n")) {
    const linha = linhaBruta.replace(/#.*/, "").trim();
    const [chave, ...resto] = linha.split(":");
    const valor = resto.join(":").trim();
    const campo = chave?.trim().toLowerCase();
    if (campo === "user-agent") {
      if (!lendoAgentes || !atual) {
        atual = { agentes: [], bloqueios: [] };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
      lendoAgentes = true;
    } else if (campo === "disallow" && atual) {
      if (valor) atual.bloqueios.push(valor);
      lendoAgentes = false;
    } else if (campo) {
      lendoAgentes = false;
    }
  }
  const nosso = grupos.find((g) => g.agentes.some((a) => a !== "*" && NOME_DO_ROBO.includes(a)));
  const geral = grupos.find((g) => g.agentes.includes("*"));
  return ((nosso ?? geral)?.bloqueios ?? []).map(regraParaRegex);
}

export async function podeAbrir(endereco: string) {
  const url = new URL(endereco);
  if (!cacheRobots.has(url.origin)) {
    cacheRobots.set(
      url.origin,
      buscar(`${url.origin}/robots.txt`)
        .then(({ texto }) => lerRobots(texto))
        .catch(() => []), // sem robots.txt: pode
    );
  }
  const bloqueios = await cacheRobots.get(url.origin)!;
  const caminho = url.pathname + url.search;
  return !bloqueios.some((r) => r.test(caminho));
}

function meta(html: string, nome: string) {
  return (
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${nome}["']`, "i"))?.[1] ??
    null
  );
}

/** Tira as linhas curtas do começo ("play", "ESPN.com.br", "11 de out,
 * 2026, 23:58"): rótulos do player, nome do site e data que o Readability
 * pega junto. Para no primeiro parágrafo de verdade. O que o site repete
 * em toda matéria (propaganda no fim, por exemplo) o limpar_textos.py do
 * coletor aprende e tira depois. */
function semCabecalho(texto: string) {
  const linhas = texto.split("\n");
  let inicio = 0;
  while (inicio < Math.min(linhas.length - 1, 6) && linhas[inicio].split(/\s+/).length < 6) inicio++;
  return linhas.slice(inicio).join("\n");
}

/** Bloco de "Perguntas frequentes" no fim da matéria (Exame): a pergunta
 * fica num <summary> e a resposta num parágrafo, que reconta a notícia e
 * parecia texto duplicado. Sai antes do Readability (mesma regra do
 * coletor, texto.sem_perguntas_frequentes). */
const PERGUNTAS_FREQUENTES = /perguntas\s+frequentes|perguntas\s+e\s+respostas|\bfaq\b|frequently\s+asked/i;

function semPerguntasFrequentes(document: { querySelectorAll: (s: string) => ArrayLike<Element> }) {
  for (const el of Array.from(document.querySelectorAll("details"))) el.remove();
  for (const titulo of Array.from(document.querySelectorAll("h2, h3, h4"))) {
    if (!titulo.parentElement || !PERGUNTAS_FREQUENTES.test(titulo.textContent ?? "")) continue;
    if (titulo.parentElement.tagName === "SECTION") {
      titulo.parentElement.remove();
      continue;
    }
    // sem <section>: o título e o que vem depois até o próximo título do mesmo nível
    let irmao = titulo.nextElementSibling;
    while (irmao && !(/^H[1-4]$/.test(irmao.tagName) && irmao.tagName <= titulo.tagName)) {
      const seguinte = irmao.nextElementSibling;
      irmao.remove();
      irmao = seguinte;
    }
    titulo.remove();
  }
}

export type PaginaExtraida = { texto: string | null; imagem: string | null; autor: string | null; paywall: boolean };

export async function extrairPagina(endereco: string): Promise<PaginaExtraida> {
  const { url, texto: html } = await buscar(endereco);
  const imagemBruta = meta(html, "og:image") ?? meta(html, "twitter:image");
  const imagem = imagemBruta ? new URL(imagemBruta, url).toString() : null;
  let autor = meta(html, "author");
  const paywall = /"isAccessibleForFree"\s*:\s*"?false"?/i.test(html);

  let texto: string | null = null;
  if (!paywall) {
    const { document } = parseHTML(html);
    semPerguntasFrequentes(document);
    const artigo = new Readability(document as unknown as Document).parse();
    if (artigo?.content) texto = semCabecalho(limparTexto(htmlParaTexto(artigo.content))).slice(0, MAX_CARACTERES) || null;
    autor = autor ?? artigo?.byline ?? null;
  }
  return { texto, imagem, autor, paywall };
}
