import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

function formatarData(iso: string | null) {
  if (!iso) return "data não informada";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: topicos } = await supabase
    .from("topics")
    .select("id, name")
    .order("created_at");

  const { data: artigos } = await supabase
    .from("articles")
    .select("id, title, url, author, content, published_at, sources(topic_id, topics(name))")
    .order("collected_at", { ascending: false })
    .limit(30);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={topicos ?? []} />

      <div className="flex min-w-0 flex-grow flex-col">
        <div className="flex items-start justify-between px-10 pt-6">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-foreground">Início</div>
            <div className="mono text-xs text-text-muted">
              {artigos?.length ?? 0} artigo(s)
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-grow overflow-y-auto px-10 pt-5 pb-8">
          <div className="flex max-w-[800px] flex-col gap-7">
            {(!artigos || artigos.length === 0) && (
              <p className="text-sm text-text-secondary">
                Nenhum artigo coletado ainda. Cadastre um tópico e uma fonte em{" "}
                <span className="font-semibold">Gerenciar fontes</span>.
              </p>
            )}

            {artigos?.map((artigo) => {
              // Sem tipos gerados pro schema ainda (precisa do Supabase
              // MCP do projeto certo conectado) — o embed aninhado do
              // PostgREST fica como `any` por enquanto.
              const artigoComTopico = artigo as typeof artigo & {
                sources?: { topics?: { name?: string } };
              };
              const nomeTopico = artigoComTopico.sources?.topics?.name;
              return (
                <div
                  key={artigo.id}
                  className="flex gap-4 rounded-xl border border-border bg-surface p-[18px]"
                >
                  <div className="flex w-[168px] flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="8.5" cy="10" r="1.5" />
                      <path d="M21 15l-5-5-9 9" />
                    </svg>
                  </div>

                  <div className="flex min-w-0 flex-grow flex-col gap-2">
                    {nomeTopico && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="mono text-[10px] font-bold tracking-wider text-text-muted uppercase">
                          {nomeTopico}
                        </span>
                      </div>
                    )}
                    <div className="text-base font-bold text-foreground">
                      {artigo.title}
                    </div>
                    <div className="mono text-[11px] text-text-muted">
                      {artigo.author ?? "autor não informado"} ·{" "}
                      {formatarData(artigo.published_at)}
                    </div>
                    {artigo.content && (
                      <div className="line-clamp-2 text-[13px] text-text-secondary">
                        {artigo.content}
                      </div>
                    )}
                    <a
                      href={artigo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 text-xs font-bold text-accent"
                    >
                      Ler artigo completo →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
