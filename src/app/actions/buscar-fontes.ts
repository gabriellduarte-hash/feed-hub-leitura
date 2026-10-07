"use server";

import { createClient } from "@/lib/supabase/server";
import { detectarFonte, type Via } from "@/lib/descobrir-fonte";
import { hostDe } from "@/lib/fonte";

export type FonteNaWeb = { url: string; nome: string; host: string };

const TEMPO_MAXIMO_MS = 15_000;

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Endereços pra tentar a partir do que a pessoa digitou: o próprio
 * endereço, se parece um ("tecmundo.com.br"), ou o nome do veículo como
 * domínio ("estadão" -> estadao.com.br, "jornal do comércio" ->
 * jornaldocomercio.com.br, jornaldocomercio.com). Com e sem "www": há
 * site que barra um dos dois (o Estadão responde 403 sem o www). */
function enderecosProvaveis(termo: string): { enderecos: string[]; nome: string } {
  const limpo = termo.trim();
  if (/^\S+\.\S+$/.test(limpo)) return { enderecos: [limpo], nome: "" };
  const palavras = semAcento(limpo).split(/[^a-z0-9]+/).filter(Boolean);
  if (palavras.length === 0) return { enderecos: [], nome: "" };
  const junto = palavras.join("");
  const dominios = [`${junto}.com.br`, `${junto}.com`];
  if (palavras.length > 1) dominios.push(`${palavras.join("-")}.com.br`);
  return { enderecos: dominios.flatMap((d) => [`www.${d}`, d]), nome: junto };
}

// Quando o mesmo site aparece por mais de um endereço, fica o melhor jeito de ler
const PREFERENCIA: Record<Via, number> = {
  catalogo: 0, rss: 1, "rss-na-pagina": 1, sitemap: 2, pagina: 3, "google-news": 4,
};

function comLimiteDeTempo<T>(promessa: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promessa, new Promise<null>((ok) => setTimeout(() => ok(null), ms))]);
}

/** Busca na web um veículo que não está no catálogo: tenta os endereços
 * prováveis em paralelo e, em cada um, descobre o feed do mesmo jeito que
 * o "Seguir por link" (RSS, sitemap de notícias, Google Notícias). */
export async function buscarFontesNaWeb(termo: string): Promise<FonteNaWeb[]> {
  if (termo.trim().length < 3) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { enderecos, nome } = enderecosProvaveis(termo);
  const tentativas = enderecos.map((endereco) =>
    comLimiteDeTempo(detectarFonte(supabase, endereco), TEMPO_MAXIMO_MS).catch(() => null),
  );
  const porSite = new Map<string, { fonte: FonteNaWeb; via: Via }>();
  for (const resultado of await Promise.all(tentativas)) {
    const fonte = resultado?.fonte;
    // o que já está no catálogo aparece na lista de cima
    if (!fonte || resultado.catalogoId) continue;
    const host = hostDe(fonte.url);
    // redirecionou pra outro site (cnnbrasil.com -> CNN Español): não é o procurado
    if (nome && !host.replace(/[^a-z0-9]/g, "").includes(nome)) continue;
    const atual = porSite.get(host);
    if (atual && PREFERENCIA[atual.via] <= PREFERENCIA[fonte.via]) continue;
    porSite.set(host, { fonte: { url: fonte.url, nome: fonte.nome ?? host, host }, via: fonte.via });
  }
  return [...porSite.values()].map((s) => s.fonte);
}
