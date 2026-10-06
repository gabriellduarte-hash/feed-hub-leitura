import { createClient } from "@/lib/supabase/server";
import { buscarArtigosNaOrdem } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function LerMaisTardePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_articles")
    .select("article_id")
    .order("created_at", { ascending: false });
  const artigos = await buscarArtigosNaOrdem(
    supabase,
    (data ?? []).map((s) => s.article_id as string),
  );
  const naoLidos = artigos.filter((a) => !a.lido);

  return (
    <Conteudo>
      <PageHeader
        titulo="Ler mais tarde"
        acoes={
          <FeedActions
            escopo={{ tipo: "ids", ids: naoLidos.map((a) => a.id) }}
            naoLidos={naoLidos.length}
          />
        }
      />
      {artigos.length === 0 ? (
        <Vazio
          titulo="Nada salvo ainda"
          texto="Toque no marcador de uma notícia para guardá-la aqui e ler quando quiser."
        />
      ) : (
        <ArticleList secoes={[{ titulo: "Mais recentes", artigos }]} mostrarFim />
      )}
    </Conteudo>
  );
}
