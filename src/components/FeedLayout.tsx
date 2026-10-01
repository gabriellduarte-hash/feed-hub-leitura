import Link from "next/link";
import type { Secao, Sugestao } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
import { ArticleList } from "./ArticleList";
import { Icon } from "./Icon";

export function Conteudo({ children, largo = false }: { children: React.ReactNode; largo?: boolean }) {
  return (
    <div className={`mx-auto w-full px-10 pb-16 ${largo ? "max-w-[960px]" : "max-w-[900px]"}`}>
      {children}
    </div>
  );
}

export function FeedComSugestoes({
  secoes,
  sugestoes,
  vazio,
}: {
  secoes: Secao[];
  sugestoes: Sugestao[];
  vazio: React.ReactNode;
}) {
  return (
    <div className="flex gap-14">
      <div className="min-w-0 flex-grow">
        {secoes.length === 0 ? vazio : <ArticleList secoes={secoes} mostrarFim />}
      </div>
      {sugestoes.length > 0 && (
        <aside className="hidden w-[220px] flex-shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <h2 className="text-[13px] text-text-secondary">Você também pode gostar</h2>
            {sugestoes.map((s) => (
              <Link
                key={s.id}
                href={`/explorar?categoria=${encodeURIComponent(s.categoria)}`}
                className="group flex items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faviconDe(s.host)}
                  alt=""
                  className="h-9 w-9 flex-shrink-0 rounded-lg bg-surface-active p-1 transition-transform duration-150 group-hover:scale-105"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:underline">
                    {s.nome}
                  </div>
                  <div className="truncate text-xs text-text-muted">{s.categoria}</div>
                </div>
              </Link>
            ))}
            <Link
              href="/explorar"
              className="w-fit rounded-md border border-border px-2.5 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover"
            >
              Explorar
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}

export function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: { rotulo: string; href: string };
}) {
  return (
    <div className="animate-fade-up flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-8 py-10">
      <Icon nome="rss" tamanho={28} className="text-accent" />
      <div className="text-lg font-semibold text-foreground">{titulo}</div>
      <p className="max-w-[440px] text-sm text-text-secondary">{texto}</p>
      {acao && (
        <Link
          href={acao.href}
          className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
