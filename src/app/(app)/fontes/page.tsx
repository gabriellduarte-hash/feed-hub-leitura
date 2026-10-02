import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { faviconDe, hostDe, nomeDaFonte } from "@/lib/fonte";
import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { criarTopico } from "./actions";
import { BotaoRemoverFonte } from "./BotaoRemoverFonte";
import { AdicionarFonteForm } from "./AdicionarFonteForm";

type Topico = {
  id: string;
  name: string;
  sources: { id: string; name: string | null; url: string; type: string }[];
};

export default async function OrganizarFontesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, name, sources(id, name, url, type)")
    .order("created_at");
  const topicos = (data ?? []) as Topico[];

  return (
    <Conteudo>
      <PageHeader
        titulo="Organizar fontes"
        subtitulo="Coleções agrupam suas fontes no menu lateral. Pra renomear, mover ou favoritar uma fonte, use o menu … dela no menu lateral."
      />

      <form action={criarTopico} className="mb-10 flex items-center gap-2">
        <input
          name="nome"
          required
          placeholder="Nome da nova coleção (ex.: Economia)"
          className="h-10 flex-grow rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted"
        />
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Nova coleção
        </button>
      </form>

      {topicos.length === 0 && (
        <p className="text-sm text-text-secondary">
          Nenhuma coleção ainda — crie uma acima ou{" "}
          <Link href="/explorar" className="text-accent hover:underline">
            siga fontes do catálogo
          </Link>
          .
        </p>
      )}

      <div className="flex flex-col gap-10">
        {topicos.map((topico) => (
          <section key={topico.id} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <Link
                href={`/feeds/colecao/${topico.id}`}
                className="text-[17px] font-semibold text-foreground hover:underline"
              >
                {topico.name}
              </Link>
              <span className="text-[13px] text-text-muted">
                {topico.sources.length} {topico.sources.length === 1 ? "fonte" : "fontes"}
              </span>
            </div>

            {topico.sources.length === 0 && (
              <div className="py-3 text-[13px] text-text-muted">Nenhuma fonte nesta coleção.</div>
            )}

            {topico.sources.map((fonte) => (
              <div
                key={fonte.id}
                className="group -mx-3 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconDe(hostDe(fonte.url))} alt="" className="h-5 w-5 rounded-sm" />
                <Link
                  href={`/feeds/fonte/${fonte.id}`}
                  className="min-w-0 flex-grow truncate text-sm text-foreground hover:underline"
                >
                  {nomeDaFonte(fonte.name, fonte.url)}
                </Link>
                <span className="hidden max-w-[260px] truncate text-xs text-text-muted md:block">
                  {fonte.url}
                </span>
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">
                  {fonte.type}
                </span>
                <BotaoRemoverFonte id={fonte.id} nome={nomeDaFonte(fonte.name, fonte.url)} />
              </div>
            ))}

            <AdicionarFonteForm topicId={topico.id} />
          </section>
        ))}
      </div>
    </Conteudo>
  );
}
