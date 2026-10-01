import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { seguirFeedDoCatalogo } from "./actions";

type ItemCatalogo = {
  id: string;
  category: string;
  name: string;
  url: string;
  description: string | null;
};

export default async function ExplorarPage() {
  const supabase = await createClient();

  const { data: topicos } = await supabase.from("topics").select("id, name").order("created_at");

  const { data: catalogoData } = await supabase
    .from("feed_catalog")
    .select("id, category, name, url, description")
    .order("category")
    .order("name");
  const catalogo = (catalogoData ?? []) as ItemCatalogo[];

  const { data: fontesSeguidas } = await supabase.from("sources").select("url");
  const urlsSeguidas = new Set((fontesSeguidas ?? []).map((f) => f.url));

  const grupos = new Map<string, ItemCatalogo[]>();
  for (const item of catalogo) {
    if (!grupos.has(item.category)) grupos.set(item.category, []);
    grupos.get(item.category)!.push(item);
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={topicos ?? []} />

      <div className="flex-grow overflow-y-auto px-10 py-7">
        <div className="flex max-w-[800px] flex-col gap-8">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-foreground">Explorar</div>
            <p className="text-sm text-text-secondary">
              Feeds conhecidos, por categoria. Seguir cria (ou reaproveita) um tópico com o nome
              da categoria.
            </p>
          </div>

          {[...grupos.entries()].map(([categoria, itens]) => (
            <div key={categoria} className="flex flex-col gap-3.5">
              <div className="mono border-b border-foreground pb-1.5 text-[13px] font-bold tracking-wider text-foreground uppercase">
                {categoria}
              </div>
              <div className="flex flex-col gap-3">
                {itens.map((item) => {
                  const seguindo = urlsSeguidas.has(item.url);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                    >
                      <div className="flex min-w-0 flex-grow flex-col gap-0.5">
                        <div className="text-sm font-bold text-foreground">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-text-secondary">{item.description}</div>
                        )}
                      </div>
                      {seguindo ? (
                        <span className="flex-shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted">
                          Seguindo
                        </span>
                      ) : (
                        <form action={seguirFeedDoCatalogo} className="flex-shrink-0">
                          <input type="hidden" name="category" value={item.category} />
                          <input type="hidden" name="url" value={item.url} />
                          <button
                            type="submit"
                            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-transform duration-150 hover:scale-105 active:scale-95"
                          >
                            Seguir
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
