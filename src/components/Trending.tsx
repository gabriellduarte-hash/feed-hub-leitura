import type { ArtigoLista } from "@/lib/feed";
import { Icon } from "./Icon";

/* Faixa "Trending" no topo do Início: as histórias das últimas 12h que
 * mais fontes estão cobrindo (buscarTrending). Abre no mesmo leitor da
 * lista. No celular, rola pro lado. */
export function Trending({
  artigos,
  abertoId,
  onAbrir,
}: {
  artigos: ArtigoLista[];
  abertoId: string | null;
  onAbrir: (artigo: ArtigoLista) => void;
}) {
  return (
    <section aria-label="Trending" className="mb-10 max-w-[720px]">
      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-foreground uppercase">
        <Icon nome="tendencia" tamanho={15} className="text-accent" />
        Trending
        <span className="h-px flex-grow bg-border" />
        <span className="font-light tracking-normal text-text-muted normal-case">últimas 12h</span>
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {artigos.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAbrir(a)}
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            className={`animate-fade-up group flex w-[236px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-lg border bg-surface text-left transition duration-200 hover:-translate-y-0.5 ${
              a.id === abertoId ? "border-accent" : "border-border hover:border-accent/60"
            }`}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-active">
              {a.image_url && (
                // <img> simples pelo mesmo motivo da lista: URLs de qualquer site
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                />
              )}
              {a.category && (
                <span className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  #{a.category.toLowerCase()}
                </span>
              )}
            </div>
            <div className="flex flex-grow flex-col gap-2.5 p-3">
              <h3 className="line-clamp-3 text-[13.5px] leading-snug font-bold tracking-tight text-foreground">{a.title}</h3>
              <p className="mt-auto flex min-w-0 items-center gap-1.5 text-[11px] text-text-muted">
                <span className="truncate font-semibold text-text-secondary">{a.fonteNome}</span>
                <span aria-hidden>·</span>
                <span className="flex-shrink-0">{a.tempo}</span>
                {!!a.cobertura && (
                  <span className="ml-auto flex-shrink-0 font-semibold text-accent" title="Fontes que publicaram a mesma história">
                    em {a.cobertura + 1} fontes
                  </span>
                )}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
