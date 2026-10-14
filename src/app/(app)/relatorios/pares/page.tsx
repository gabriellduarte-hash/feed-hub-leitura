import Link from "next/link";
import { notFound } from "next/navigation";
import { ehAdmin } from "@/lib/admin";
import { clienteAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { MarcarPar, type Par, type ParMarcado } from "@/components/Pares";

/* Amostra marcada à mão (sql/045): dois títulos, "mesma história?". O
 * coletor sorteia pares de todas as faixas de nota do agrupamento; com as
 * respostas, agrupar.py --medir diz a precisão e a cobertura. A nota fica
 * escondida até responder, pra não influenciar. Só ADMIN_EMAILS. */

const CAMPOS = "id, a_url, b_url, a_titulo, b_titulo, a_fonte, b_fonte, a_trecho, b_trecho, a_quando, b_quando";

export default async function ParesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!ehAdmin(user?.email)) notFound();

  const admin = clienteAdmin();
  const [{ data: pendentes, count: quantosPendentes }, { count: marcados }, { data: ultimos }] = admin
    ? await Promise.all([
        // ordem pela URL, não pela de sorteio (que vai faixa por faixa e entregaria a nota)
        admin.from("pares_avaliados").select(CAMPOS, { count: "exact" }).is("resposta", null).order("a_url").limit(1),
        admin.from("pares_avaliados").select("id", { count: "exact", head: true }).not("resposta", "is", null),
        admin
          .from("pares_avaliados")
          .select("id, resposta, juntou, nota, a_titulo, b_titulo")
          .not("resposta", "is", null)
          .order("respondido_em", { ascending: false })
          .limit(1),
      ])
    : [{ data: null, count: 0 }, { count: 0 }, { data: null }];

  return (
    <Conteudo largo>
      <PageHeader
        sobretitulo="Relatórios"
        titulo="Mesma história?"
        subtitulo={
          <>
            {(marcados ?? 0).toLocaleString("pt-BR")} marcados · {(quantosPendentes ?? 0).toLocaleString("pt-BR")} pra marcar ·{" "}
            <Link href="/relatorios" className="underline underline-offset-2 hover:text-accent">
              voltar
            </Link>
          </>
        }
      />
      {!admin ? (
        <p className="text-sm text-text-secondary">
          Falta a <code>SUPABASE_SECRET_KEY</code> na Vercel.
        </p>
      ) : (
        <MarcarPar
          par={(pendentes?.[0] as Par | undefined) ?? null}
          anterior={(ultimos?.[0] as ParMarcado | undefined) ?? null}
        />
      )}
    </Conteudo>
  );
}
