import { createClient } from "@/lib/supabase/server";
import { agruparPorCategoria, agruparPorFonte, buscarArtigos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader, Tabs } from "@/components/PageHeader";

export default async function HojePage(props: PageProps<"/">) {
  const { aba: abaParam } = await props.searchParams;
  const aba = abaParam === "explorar" ? "explorar" : "eu";

  const supabase = await createClient();
  const artigos = await buscarArtigos(supabase, { limite: 60 });
  const naoLidos = artigos.filter((a) => !a.lido);

  // "Eu": o que chegou das suas fontes, agrupado por fonte (como a Feedly).
  // "Explorar": os mesmos artigos pela categoria que a IA atribuiu.
  const secoes = aba === "eu" ? agruparPorFonte(artigos) : agruparPorCategoria(artigos);

  return (
    <Conteudo>
      <PageHeader
        titulo="Hoje"
        subtitulo="O que você precisa saber pra ficar por dentro"
        acoes={
          <FeedActions
            escopo={{ tipo: "ids", ids: naoLidos.map((a) => a.id) }}
            naoLidos={naoLidos.length}
          />
        }
      />
      <Tabs
        ativa={aba}
        abas={[
          { chave: "eu", rotulo: "Eu", href: "/" },
          { chave: "explorar", rotulo: "Explorar", href: "/?aba=explorar" },
        ]}
      />

      {artigos.length === 0 ? (
        <Vazio
          titulo="Seu feed está vazio"
          texto="Siga alguns sites e os artigos novos aparecem aqui assim que o coletor rodar."
          acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
        />
      ) : (
        <ArticleList secoes={secoes} />
      )}
    </Conteudo>
  );
}
