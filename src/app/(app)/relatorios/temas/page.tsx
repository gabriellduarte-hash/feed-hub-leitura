import Link from "next/link";
import { notFound } from "next/navigation";
import { ehAdmin } from "@/lib/admin";
import { clienteAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { ConferirTemas, type NoticiaParaConferir } from "@/components/ConferirTemas";

/* Temas certos? (sql/048): uma notícia por vez com os temas que o coletor
 * deu; marque os errados. Mede o acerto de cada tema (painel em
 * Relatórios). Só ADMIN_EMAILS. */
export default async function ConferirTemasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!ehAdmin(user?.email)) notFound();

  const admin = clienteAdmin();
  const [{ data: pendentes, count }, { count: conferidas }] = admin
    ? await Promise.all([
        admin
          .from("temas_avaliados")
          .select("id, url, titulo, trecho, fonte, categoria, temas", { count: "exact" })
          .is("respondido_em", null)
          .order("id")
          .limit(1),
        admin.from("temas_avaliados").select("id", { count: "exact", head: true }).not("respondido_em", "is", null),
      ])
    : [{ data: null, count: 0 }, { count: 0 }];
  const noticia = (pendentes?.[0] as NoticiaParaConferir | undefined) ?? null;

  return (
    <Conteudo>
      <PageHeader
        sobretitulo="Relatórios"
        titulo="Temas certos?"
        subtitulo={
          <>
            {(conferidas ?? 0).toLocaleString("pt-BR")} conferidas · {(count ?? 0).toLocaleString("pt-BR")} pra conferir ·{" "}
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
      ) : noticia ? (
        <ConferirTemas key={noticia.id} noticia={noticia} />
      ) : (
        <div className="rounded-md border border-dashed border-border px-8 py-10 text-sm text-text-secondary">
          Nada pra conferir agora. A coleta sorteia mais 20 notícias quando ficam menos de 10.
        </div>
      )}
    </Conteudo>
  );
}
