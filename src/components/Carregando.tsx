import { Conteudo } from "./FeedLayout";

/* Esqueletos de carregamento: aparecem na hora em que você troca de
 * página (pelos loading.tsx) enquanto o servidor busca as notícias. */

export function LinhaEsqueleto() {
  return (
    <div className="flex animate-pulse gap-4 py-[var(--linha-py)] sm:gap-5">
      <div className="aspect-[16/10] w-[104px] flex-shrink-0 bg-surface-active sm:w-[var(--capa-largura)]" />
      <div className="flex flex-grow flex-col gap-2.5 pt-1">
        <div className="h-3.5 w-4/5 rounded bg-surface-active" />
        <div className="h-3 w-2/5 rounded bg-surface-active" />
        <div className="h-3 w-full rounded bg-surface-hover" />
      </div>
    </div>
  );
}

export function EsqueletoPagina() {
  return (
    <Conteudo>
      <div role="status" aria-label="Carregando">
        <div className="flex animate-pulse flex-col gap-3 pt-6 pb-6 md:pt-10 md:pb-8">
          <div className="h-7 w-44 rounded bg-surface-active md:h-8" />
          <div className="h-3.5 w-64 max-w-full rounded bg-surface-hover" />
        </div>
        <div className="flex max-w-[720px] flex-col gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <LinhaEsqueleto key={i} />
          ))}
        </div>
      </div>
    </Conteudo>
  );
}
