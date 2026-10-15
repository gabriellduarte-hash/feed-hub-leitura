import { createClient } from "@/lib/supabase/server";
import { buscarArtigosNaOrdem } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { BuscaNasNoticias } from "@/components/BuscaNasNoticias";

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
      {/* no celular esta é a aba de baixo "Lidos": a busca fica aqui (no computador, Buscar está no menu) */}
      <div className="md:hidden">
        <BuscaNasNoticias />
      </div>
      {artigos.length === 0 ? (
        <Vazio
          titulo="Nenhuma notícia lida ainda"
          texto="As notícias que você abrir aparecem aqui."
        />
      ) : (
        <ArticleList secoes={[{ titulo: "Mais recentes", artigos }]} mostrarFim origem="lidos" />
      )}
    </Conteudo>
  );
}
