import { createClient } from "@/lib/supabase/server";
import { buscarArtigos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo } from "@/components/FeedLayout";
import { BuscaNasNoticias } from "@/components/BuscaNasNoticias";
import { PageHeader } from "@/components/PageHeader";
import { registrarBusca } from "@/lib/eventos";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const { q } = await props.searchParams;
  const termo = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const artigos = termo ? await buscarArtigos(supabase, { busca: termo }) : [];
  if (termo) await registrarBusca(supabase, { origem: "noticias", termo, resultados: artigos.length });

  return (
    <Conteudo>
      <PageHeader titulo="Buscar" />
      <BuscaNasNoticias termo={termo} focar />

      {termo && artigos.length === 0 && (
        <p className="text-sm text-text-secondary">Nada encontrado para &quot;{termo}&quot;.</p>
      )}
      {artigos.length > 0 && (
        <ArticleList
          key={termo}
          origem="busca"
          secoes={[
            {
              titulo: `${artigos.length} ${artigos.length === 1 ? "resultado" : "resultados"} para "${termo}"`,
              artigos,
            },
          ]}
        />
      )}
    </Conteudo>
  );
}
