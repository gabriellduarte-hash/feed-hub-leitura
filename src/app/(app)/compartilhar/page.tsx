import { createClient } from "@/lib/supabase/server";
import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { removerDestinatario } from "./actions";
import { AdicionarDestinatarioForm } from "./AdicionarDestinatarioForm";

const LIMITE_DESTINATARIOS = 10;

export default async function CompartilharPage() {
  const supabase = await createClient();

  const { data: destinatarios } = await supabase
    .from("digest_recipients")
    .select("id, email, created_at")
    .order("created_at");

  const total = destinatarios?.length ?? 0;

  return (
    <Conteudo>
      <PageHeader
        titulo="Compartilhar resumo diário"
        subtitulo={`Além de você, esses e-mails também recebem o resumo diário por IA. Limite de ${LIMITE_DESTINATARIOS}.`}
      />
      <div className="flex max-w-[560px] flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-[22px]">
            <div className="mono text-xs font-semibold text-text-muted">
              {total}/{LIMITE_DESTINATARIOS} destinatários
            </div>

            <div className="flex flex-col gap-2">
              {total === 0 && (
                <div className="text-[13px] text-text-muted">
                  Nenhum destinatário extra ainda — só você recebe o resumo.
                </div>
              )}
              {destinatarios?.map((destinatario) => (
                <div
                  key={destinatario.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="mono flex-grow truncate text-xs text-foreground">
                    {destinatario.email}
                  </div>
                  <form action={removerDestinatario}>
                    <input type="hidden" name="id" value={destinatario.id} />
                    <button
                      type="submit"
                      aria-label="Remover destinatário"
                      className="text-text-muted transition-colors hover:text-red-500"
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

            {total < LIMITE_DESTINATARIOS && (
              <div className="border-t border-border pt-3">
                <AdicionarDestinatarioForm />
              </div>
            )}
          </div>
      </div>
    </Conteudo>
  );
}
