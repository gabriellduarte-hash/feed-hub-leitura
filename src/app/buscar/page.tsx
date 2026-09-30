import { createClient } from "@/lib/supabase/server";
import { buscarIdsSalvos } from "@/lib/saved-ids";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard, type Artigo } from "@/components/ArticleCard";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const searchParams = await props.searchParams;
  const termo = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const supabase = await createClient();
  const { data: topicos } = await supabase.from("topics").select("id, name").order("created_at");

  let artigos: Artigo[] = [];
  if (termo) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, url, author, content, ai_summary, category, published_at, image_url")
      .or(`title.ilike.%${termo}%,content.ilike.%${termo}%`)
      .order("collected_at", { ascending: false })
      .limit(60);
    artigos = (data ?? []) as Artigo[];
  }

  const salvos = await buscarIdsSalvos(supabase);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={topicos ?? []} />

      <div className="flex min-w-0 flex-grow flex-col">
        <div className="px-10 pt-6">
          <div className="text-2xl font-bold text-foreground">Buscar</div>
          <form method="GET" className="mt-3 flex max-w-[500px] items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={termo}
              placeholder="Buscar no título ou no texto dos artigos"
              className="h-10 flex-grow rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="flex-grow overflow-y-auto px-10 pt-5 pb-8">
          <div className="flex max-w-[800px] flex-col gap-4">
            {!termo && (
              <p className="text-sm text-text-secondary">Digite um termo pra buscar.</p>
            )}
            {termo && artigos.length === 0 && (
              <p className="text-sm text-text-secondary">
                Nenhum artigo encontrado pra &quot;{termo}&quot;.
              </p>
            )}
            {artigos.map((artigo) => (
              <ArticleCard
                key={artigo.id}
                artigo={artigo}
                salvo={salvos.has(artigo.id)}
                path={`/buscar?q=${encodeURIComponent(termo)}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
