import { Conteudo } from "./FeedLayout";
import { LogoReduzida } from "./Logo";

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

/** Rodinha pra botão ocupado ("Entrando…"). Herda a cor do texto. */
export function Girando({ tamanho = 15 }: { tamanho?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: tamanho, height: tamanho }}
      className="inline-block flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/** Tela inteira enquanto o feed abre depois de entrar (login, senha nova):
 * o primeiro carregamento busca coleções, fontes e notícias e leva uns
 * segundos, e sem isso o clique parecia não ter funcionado. Fica até a
 * página do feed tomar o lugar. */
export function TelaAbrindoFeed() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-aparece fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-background"
    >
      <LogoReduzida tamanho={56} className="animate-pulse" />
      <p className="flex items-center gap-2.5 text-[14px] font-semibold text-text-secondary">
        <Girando tamanho={14} />
        Abrindo o seu feed…
      </p>
    </div>
  );
}
