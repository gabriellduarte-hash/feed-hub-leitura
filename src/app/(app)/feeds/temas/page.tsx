import { createClient } from "@/lib/supabase/server";
import { buscarPagina } from "@/lib/feed";
import { idDoItem, type ItemSeguido } from "@/lib/seguir";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

/* Todos os temas e nomes seguidos (sql/046): uma notícia por história,
 * dos últimos 7 dias, das fontes da pessoa e do catálogo. Cada notícia
 * diz qual tema a trouxe. */
export default async function TodosOsTemasPage() {
  const supabase = await createClient();
  const [{ data }, pagina] = await Promise.all([
    supabase.from("seguindo").select("tipo, chave, rotulo"),
    buscarPagina(supabase, { seguindo: true }),
  ]);
  const seguidos = (data ?? []) as ItemSeguido[];
  // a lista recomeça (sem as páginas já carregadas) quando o que a pessoa segue muda
  const chave = seguidos.map(idDoItem).sort().join("|");

  return (
    <Conteudo>
      <PageHeader
        sobretitulo="Temas"
        titulo="Todos os temas"
        subtitulo="Notícias dos últimos 7 dias sobre o que você segue, nas suas fontes e em sites do Brasil, uma por história"
      />
      {seguidos.length === 0 ? (
        <Vazio
          titulo="Você ainda não segue nenhum tema"
          texto="Siga temas, pessoas, times, empresas, filmes ou jogos. As notícias deles aparecem aqui e no menu, como as das fontes, e as mais importantes sobem no seu resumo por e-mail."
          acao={{ rotulo: "Seguir temas", href: "/explorar?aba=temas" }}
        />
      ) : pagina.artigos.length === 0 ? (
        <Vazio titulo="Nada nos últimos 7 dias" texto="Nenhuma notícia recente fala do que você segue. Novas notícias chegam a cada hora." />
      ) : (
        <ArticleList key={`temas-${chave}`} origem="seguindo" feed={{ ...pagina, filtro: { seguindo: true } }} />
      )}
    </Conteudo>
  );
}
