import { type NextRequest, NextResponse } from "next/server";
import { extrairPagina, podeAbrir } from "@/lib/extrair-pagina";
import { gravarNoticias } from "@/lib/gravar-noticias";
import { coletarFonte } from "@/lib/leitor-feeds";
import { clienteAdmin } from "@/lib/supabase/admin";

/* Sites abertos que barram as máquinas do GitHub (sql/040,
 * coletar_pelo_hub): o coletor em Python não consegue nem o RSS nem as
 * páginas deles, mas da Vercel eles respondem. O workflow "Coleta de
 * notícias" chama esta rota toda hora, antes do resumo da IA:
 *   1. lê o feed de cada um (feeds seguidos e fontes da vitrine);
 *   2. grava sem repetir o que já veio pelo Google Notícias;
 *   3. abre as páginas das notícias sem texto ou sem foto (respeitando o
 *      robots.txt e o paywall, ver extrair-pagina.ts).
 * Protegida por COLETA_SECRET (o mesmo valor na Vercel e no GitHub). */

export const maxDuration = 60;

const ORCAMENTO_MS = 45_000; // folga antes do limite da função
const PAGINAS_POR_RODADA = 40;
const PAGINAS_EM_PARALELO = 4;
const TEXTO_CURTO = 600; // abaixo disso, o "texto" é só a descrição do feed
// Resumo do feed que chama pro site ("Continue lendo »"): cortado, mesmo
// passando de TEXTO_CURTO. Mesma regra do coletor (enriquecer.CORTADO).
const CORTADO = /(continue lendo|leia mais|read more|keep reading)\s*(»|›|\.\.\.|…)/i;

type Pendente = { id: string; url: string; content: string | null; image_url: string | null; author: string | null };

export async function POST(request: NextRequest) {
  const segredo = process.env.COLETA_SECRET?.trim();
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const admin = clienteAdmin();
  if (!admin) return NextResponse.json({ erro: "SUPABASE_SECRET_KEY não configurada" }, { status: 500 });
  const inicio = Date.now();
  const relatorio = { fontes: 0, novas: 0, paginas: 0, comTexto: 0, comFoto: 0, paywall: 0, robots: 0, erros: [] as string[] };

  // 1 e 2) feeds seguidos e fontes da vitrine que o hub coleta
  const [{ data: feeds }, { data: catalogo }] = await Promise.all([
    admin.from("feeds").select("id, url, type, sources!inner(id)").eq("coletar_pelo_hub", true),
    admin.from("feed_catalog").select("id, url, kind").eq("coletar_pelo_hub", true).eq("vitrine", true),
  ]);
  const fontes = [
    ...(feeds ?? []).map((f) => ({ destino: { tabela: "articles" as const, feedId: f.id as string }, url: f.url as string, tipo: f.type as string })),
    ...(catalogo ?? []).map((c) => ({
      destino: { tabela: "catalog_articles" as const, catalogoId: c.id as string },
      url: c.url as string,
      tipo: c.kind as string,
    })),
  ];
  relatorio.fontes = fontes.length;
  await Promise.all(
    fontes.map(async (f) => {
      try {
        relatorio.novas += await gravarNoticias(admin, f.destino, await coletarFonte(f.url, f.tipo));
      } catch (erro) {
        relatorio.erros.push(`${f.url}: ${erro instanceof Error ? erro.message : erro}`);
      }
    }),
  );

  // 3) páginas das notícias sem texto ou sem foto
  const feedIds = (feeds ?? []).map((f) => f.id as string);
  const catalogoIds = (catalogo ?? []).map((c) => c.id as string);
  const buscarPendentes = async (tabela: "articles" | "catalog_articles", coluna: string, ids: string[]) => {
    if (ids.length === 0) return [];
    const { data } = await admin
      .from(tabela)
      .select("id, url, content, image_url, author")
      .in(coluna, ids)
      .is("enriquecido_em", null)
      // link do Google não abre a matéria: fica de fora já na consulta (senão
      // ocupa o lugar das diretas no limite)
      .not("url", "like", "https://news.google.com/%")
      .order("collected_at", { ascending: false })
      .limit(PAGINAS_POR_RODADA);
    return ((data ?? []) as Pendente[])
      .filter((p) => !p.content || p.content.length < TEXTO_CURTO || CORTADO.test(p.content) || !p.image_url)
      .map((p) => ({ ...p, tabela }));
  };
  const fila = [
    ...(await buscarPendentes("articles", "feed_id", feedIds)),
    ...(await buscarPendentes("catalog_articles", "catalog_id", catalogoIds)),
  ].slice(0, PAGINAS_POR_RODADA);

  const trabalhar = async () => {
    for (let item = fila.shift(); item; item = fila.shift()) {
      if (Date.now() - inicio > ORCAMENTO_MS) return; // o resto fica pra próxima hora
      const mudanca: Record<string, unknown> = { enriquecido_em: new Date().toISOString() };
      try {
        if (!(await podeAbrir(item.url))) {
          relatorio.robots++;
        } else {
          const pagina = await extrairPagina(item.url);
          relatorio.paginas++;
          if (pagina.paywall) relatorio.paywall++;
          if (pagina.texto && pagina.texto.length > (item.content?.length ?? 0)) {
            mudanca.content = pagina.texto;
            relatorio.comTexto++;
          }
          if (!item.image_url && pagina.imagem) {
            mudanca.image_url = pagina.imagem;
            relatorio.comFoto++;
          }
          if (!item.author && pagina.autor) mudanca.author = pagina.autor;
        }
      } catch (erro) {
        relatorio.erros.push(`${item.url}: ${erro instanceof Error ? erro.message : erro}`);
      }
      // marca como tentada mesmo com erro: não fica tentando a mesma página toda hora
      await admin.from(item.tabela).update(mudanca).eq("id", item.id);
    }
  };
  await Promise.all(Array.from({ length: PAGINAS_EM_PARALELO }, trabalhar));

  return NextResponse.json({ ...relatorio, erros: relatorio.erros.slice(0, 10), segundos: (Date.now() - inicio) / 1000 });
}
