import { createClient } from "@/lib/supabase/server";
import { buscarPagina, buscarSugestoes, categoriasPredominantes, contarNaoLidos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, FeedComSugestoes, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function TodosPage() {
  const supabase = await createClient();
  const pagina = await buscarPagina(supabase, {});
  const [naoLidos, sugestoes] = await Promise.all([
    contarNaoLidos(supabase),
    buscarSugestoes(supabase, categoriasPredominantes(pagina.artigos, 1)[0]),
  ]);

  return (
    <Conteudo largo>
      <PageHeader titulo="Todos" acoes={<FeedActions escopo={{ tipo: "todos" }} naoLidos={naoLidos} />} />
      <FeedComSugestoes
        sugestoes={sugestoes}
        lista={
          pagina.artigos.length === 0 ? (
            <Vazio
              titulo="Nada por aqui ainda"
              texto="Siga alguns sites para ver as notícias deles aqui."
              acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
            />
          ) : (
            <ArticleList feed={{ ...pagina, filtro: {} }} />
          )
        }
      />
    </Conteudo>
  );
}
