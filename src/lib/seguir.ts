import type { ArtigoLista } from "./feed";

/* Seguir temas e nomes (sql/045). Tema: um subassunto da taxonomia do
 * coletor ("Inteligência artificial"); nome: pessoa, organização, lugar
 * ou obra que o spaCy achou nas notícias ("Lula", "GTA 6"). As notícias
 * aparecem em Temas (no menu, abaixo das coleções) e sobem no resumo por
 * e-mail. */

export type TipoSeguido = "tema" | "nome";

/** chave: o tema como aparece, ou o nome normalizado (a mesma chave que o
 * coletor grava em palavras_chave); rotulo: como mostrar. */
export type ItemSeguido = { tipo: TipoSeguido; chave: string; rotulo: string };

export type SugestaoSeguir = ItemSeguido & { detalhe: string | null; noticias: number };

export const MAX_SEGUINDO = 100;
const MAX_NOMES_NA_NOTICIA = 6;

export const idDoItem = (item: Pick<ItemSeguido, "tipo" | "chave">) => `${item.tipo}:${item.chave}`;

/** A página das notícias de um tema ou nome (app/(app)/feeds/tema). */
export const hrefDoTema = (item: Pick<ItemSeguido, "tipo" | "chave">) =>
  `/feeds/tema/${item.tipo}/${encodeURIComponent(item.chave)}`;

/** Como o tema aparece: "#eleições"; nome fica como está ("Lula"). */
export const rotuloDoTema = (item: Pick<ItemSeguido, "tipo" | "rotulo">) =>
  item.tipo === "tema" ? `#${item.rotulo.toLowerCase()}` : item.rotulo;

/** Em ordem alfabética, como as fontes nas coleções. */
export function ordenarTemas<T extends Pick<ItemSeguido, "rotulo">>(itens: T[]) {
  return [...itens].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/** Igual ao sinais.normalizar do coletor: minúsculas, sem acento, só
 * letras, números e espaço. */
export function normalizarChave(texto: string) {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** O que dá pra seguir a partir de uma notícia: os temas dela e os
 * primeiros nomes (o coletor já ordena: os do título primeiro). */
export function seguiveisDaNoticia(a: ArtigoLista): ItemSeguido[] {
  const temas = (a.temas ?? []).map((t) => ({ tipo: "tema" as const, chave: t, rotulo: t }));
  const nomes = (a.entidades ?? [])
    .slice(0, MAX_NOMES_NA_NOTICIA)
    .map((e) => ({ tipo: "nome" as const, chave: e.chave, rotulo: e.nome }));
  return [...temas, ...nomes];
}
