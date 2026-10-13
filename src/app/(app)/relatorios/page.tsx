import Link from "next/link";
import { notFound } from "next/navigation";
import { ehAdmin } from "@/lib/admin";
import { clienteAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { PaineisDoRelatorio, type Relatorio } from "@/components/Relatorio";

/* Relatórios de uso (sql/043): só pra quem está em ADMIN_EMAILS. Tudo
 * agregado pela função relatorio_uso, chamada com a chave secreta: a
 * página nunca mostra o que uma pessoa específica leu, buscou ou seguiu. */

const PERIODOS = [7, 30, 90];

export default async function RelatoriosPage(props: PageProps<"/relatorios">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!ehAdmin(user?.email)) notFound();

  const params = await props.searchParams;
  const dias = PERIODOS.includes(Number(params.dias)) ? Number(params.dias) : 30;
  const admin = clienteAdmin();
  const { data, error } = admin ? await admin.rpc("relatorio_uso", { p_dias: dias }) : { data: null, error: true };

  return (
    <Conteudo largo>
      <PageHeader
        titulo="Relatórios"
        subtitulo="Uso do Daily Paper, sempre agregado: ninguém aparece individualmente."
        acoes={
          <div className="flex rounded-lg border border-border p-0.5 text-[12px]" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <Link
                key={p}
                href={`/relatorios?dias=${p}`}
                aria-current={p === dias ? "true" : undefined}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  p === dias ? "bg-foreground font-semibold text-background" : "text-text-secondary hover:text-foreground"
                }`}
              >
                {p} dias
              </Link>
            ))}
          </div>
        }
      />
      {error || !data ? (
        <p className="text-sm text-text-secondary">
          Não foi possível montar o relatório. Confira se o <code>sql/043</code> rodou e se a <code>SUPABASE_SECRET_KEY</code> está na
          Vercel.
        </p>
      ) : (
        <PaineisDoRelatorio r={data as Relatorio} />
      )}
    </Conteudo>
  );
}
