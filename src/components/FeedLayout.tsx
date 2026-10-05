import Link from "next/link";
import type { Sugestao } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
import { Icon } from "./Icon";

export function Conteudo({ children, largo = false }: { children: React.ReactNode; largo?: boolean }) {
  return (
    <div className={`mx-auto w-full px-10 pb-16 ${largo ? "max-w-[960px]" : "max-w-[900px]"}`}>
      {children}
    </div>
  );
}

export function FeedComSugestoes({
  lista,
  sugestoes,
  categoria,
}: {
  lista: React.ReactNode;
  sugestoes: Sugestao[];
  /** Quando vem, as sugestões são só dessa categoria (a da coleção atual). */
  categoria?: string | null;
}) {
  const hrefExplorar = categoria ? `/explorar?categoria=${encodeURIComponent(categoria)}` : "/explorar";
  return (
    <div className="flex gap-14">
      <div className="min-w-0 flex-grow">{lista}</div>
      <aside className="hidden w-[230px] flex-shrink-0 lg:block">
        <div className="sticky top-6 flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            {categoria ? (
              <>
                Mais em <span className="text-accent">#{categoria.toLowerCase()}</span>
              </>
            ) : (
              "Você também pode gostar"
            )}
          </h2>
          {sugestoes.length === 0 && (
            <p className="text-xs leading-relaxed text-text-muted">
              {categoria
                ? `Você já segue todas as fontes de #${categoria.toLowerCase()} do catálogo.`
                : "Nada novo no catálogo por enquanto."}
            </p>
          )}
          {sugestoes.map((s, i) => (
            <Link
              key={s.id}
              href={`/explorar?categoria=${encodeURIComponent(s.categoria)}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-fade-up group flex items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconDe(s.host)}
                alt=""
                className="aspect-square h-10 w-10 flex-shrink-0 rounded-xl bg-surface-active p-1.5 ring-1 ring-border transition-transform duration-150 group-hover:scale-105"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground group-hover:text-accent">{s.nome}</div>
                <div className="truncate text-xs text-text-muted">{s.descricao ?? s.host}</div>
              </div>
            </Link>
          ))}
          <Link
            href={hrefExplorar}
            className="w-fit rounded-lg border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent/50 hover:bg-surface-hover"
          >
            {categoria ? `Explorar #${categoria.toLowerCase()}` : "Explorar"}
          </Link>
        </div>
      </aside>
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
