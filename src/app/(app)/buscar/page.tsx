import Form from "next/form";
import { createClient } from "@/lib/supabase/server";
import { buscarArtigos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo } from "@/components/FeedLayout";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const { q } = await props.searchParams;
  const termo = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const artigos = termo ? await buscarArtigos(supabase, { busca: termo }) : [];

  return (
    <Conteudo>
      <PageHeader titulo="Buscar" />
      <Form action="/buscar" className="group mb-10">
        <label className="flex h-12 items-center gap-3 rounded-lg border border-border bg-surface px-4 transition-colors focus-within:border-text-muted">
          <Icon nome="buscar" className="text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={termo}
            autoFocus
            placeholder="Buscar nas suas notícias"
            className="h-full flex-grow bg-transparent text-[15px] text-foreground outline-none placeholder:text-text-muted"
          />
        </label>
      </Form>

      {termo && artigos.length === 0 && (
        <p className="text-sm text-text-secondary">Nada encontrado para &quot;{termo}&quot;.</p>
      )}
      {artigos.length > 0 && (
        <ArticleList
          key={termo}
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
