import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { criarTopico, removerFonte } from "./actions";
import { AdicionarFonteForm } from "./AdicionarFonteForm";

export default async function FontesPage() {
  const supabase = await createClient();

  const { data: topicos } = await supabase
    .from("topics")
    .select("id, name, sources(id, url, type)")
    .order("created_at");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={(topicos ?? []).map((t) => ({ id: t.id, name: t.name }))} />

      <div className="flex-grow overflow-y-auto px-10 py-7">
        <div className="flex max-w-[720px] flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              Meus tópicos e fontes
            </div>
          </div>

          <form action={criarTopico} className="flex items-center gap-2">
            <input
              name="nome"
              required
              placeholder="Nome do novo tópico (ex.: Economia)"
              className="h-10 flex-grow rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
            >
              Novo tópico
            </button>
          </form>

          {(!topicos || topicos.length === 0) && (
            <p className="text-sm text-text-secondary">
              Nenhum tópico ainda — crie um acima pra começar.
            </p>
          )}

          {topicos?.map((topico) => (
            <div
              key={topico.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-[22px]"
            >
              <div className="text-base font-bold text-foreground">
                {topico.name}
              </div>

              <div className="flex flex-col gap-2.5">
                {topico.sources.length === 0 && (
                  <div className="text-[13px] text-text-muted">
                    Nenhuma fonte cadastrada.
                  </div>
                )}
                {topico.sources.map((fonte) => (
                  <div
                    key={fonte.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="mono rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                      {fonte.type}
                    </div>
                    <div className="mono flex-grow truncate text-xs text-foreground">
                      {fonte.url}
                    </div>
                    <form action={removerFonte}>
                      <input type="hidden" name="id" value={fonte.id} />
                      <button
                        type="submit"
                        aria-label="Remover fonte"
                        className="text-text-muted"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              <AdicionarFonteForm topicId={topico.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
