import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarPagina, buscarSugestoes, categoriaDaColecao, contarNaoLidos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, FeedComSugestoes, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function ColecaoPage(props: PageProps<"/feeds/colecao/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: colecao } = await supabase
    .from("topics")
    .select("id, name, sources(id)")
    .eq("id", id)
    .maybeSingle();
  if (!colecao) notFound();

  const fonteIds = colecao.sources.map((s) => s.id as string);
  const [pagina, naoLidos, categoria] = await Promise.all([
    buscarPagina(supabase, { topicoId: id }),
    contarNaoLidos(supabase, fonteIds),
    categoriaDaColecao(supabase, id, colecao.name),
  ]);
  const sugestoes = await buscarSugestoes(supabase, categoria, { somenteCategoria: true });

  return (
    <Conteudo largo>
      <PageHeader
        titulo={colecao.name}
        subtitulo={
          <>
            {fonteIds.length} {fonteIds.length === 1 ? "fonte" : "fontes"}
            {categoria && <span className="ml-2 text-accent">#{categoria.toLowerCase()}</span>}
          </>
        }
        acoes={
          <FeedActions escopo={{ tipo: "colecao", id }} naoLidos={naoLidos} colecao={{ id, nome: colecao.name }} />
        }
      />
      <FeedComSugestoes
        categoria={categoria}
        sugestoes={sugestoes}
        lista={
          pagina.artigos.length === 0 ? (
            <Vazio
              titulo="Nenhum artigo nesta coleção"
              texto="Adicione uma fonte a esta coleção, ou espere a próxima coleta."
              acao={{ rotulo: "Adicionar fonte", href: `/explorar?colecao=${id}` }}
            />
          ) : (
            <ArticleList key={id} feed={{ ...pagina, filtro: { topicoId: id } }} />
          )
        }
      />
    </Conteudo>
  );
}
