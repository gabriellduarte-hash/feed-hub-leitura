import { createClient } from "@/lib/supabase/server";
import { buscarArtigosNaOrdem } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function LidosRecentementePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("read_articles")
    .select("article_id")
    .order("read_at", { ascending: false })
    .limit(60);
  const artigos = await buscarArtigosNaOrdem(
    supabase,
    (data ?? []).map((r) => r.article_id as string),
  );

  return (
    <Conteudo>
      <PageHeader titulo="Lidos recentemente" />
      {artigos.length === 0 ? (
        <Vazio
          titulo="Nenhum artigo lido ainda"
          texto="Os artigos que você abrir ou marcar como lidos aparecem aqui."
        />
      ) : (
        <ArticleList secoes={[{ titulo: "Mais recentes", artigos }]} mostrarFim />
      )}
    </Conteudo>
  );
}
