import { createClient } from "@/lib/supabase/server";
import { agruparPorCategoria, buscarArtigos, buscarPagina, contarNaoLidos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader, Tabs } from "@/components/PageHeader";

export default async function HojePage(props: PageProps<"/">) {
  const { aba: abaParam } = await props.searchParams;
  const aba = abaParam === "explorar" ? "explorar" : "eu";

  const supabase = await createClient();
  const naoLidos = await contarNaoLidos(supabase);

  // "Eu": tudo das suas fontes, agrupado por data, com rolagem infinita.
  // "Explorar": os artigos mais recentes pela categoria que a IA atribuiu.
  const pagina = aba === "eu" ? await buscarPagina(supabase, {}) : null;
  const porCategoria = aba === "explorar" ? await buscarArtigos(supabase, { limite: 60 }) : [];
  const vazio = pagina ? pagina.artigos.length === 0 : porCategoria.length === 0;

  return (
    <Conteudo>
      <PageHeader
        titulo="Hoje"
        subtitulo="O que você precisa saber pra ficar por dentro"
        acoes={<FeedActions escopo={{ tipo: "todos" }} naoLidos={naoLidos} />}
      />
      <Tabs
        ativa={aba}
        abas={[
          { chave: "eu", rotulo: "Eu", href: "/" },
          { chave: "explorar", rotulo: "Explorar", href: "/?aba=explorar" },
        ]}
      />

      {vazio ? (
        <Vazio
          titulo="Seu feed está vazio"
          texto="Siga alguns sites e os artigos novos aparecem aqui assim que o coletor rodar."
          acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
        />
      ) : pagina ? (
        <ArticleList key="eu" feed={{ ...pagina, filtro: {} }} />
      ) : (
        <ArticleList key="explorar" secoes={agruparPorCategoria(porCategoria)} />
      )}
    </Conteudo>
  );
}
