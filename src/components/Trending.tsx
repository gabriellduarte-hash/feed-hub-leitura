"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtigoLista } from "@/lib/feed";
import { Icon } from "./Icon";

/* Faixa "Trending" no topo do Início: as histórias das últimas 12h que
 * mais fontes estão cobrindo (buscarTrending). Abre no mesmo leitor da
 * lista. Sem barra de rolagem (igual em todo navegador): no celular rola
 * com o dedo, no computador pelas setas dos lados. */
export function Trending({
  artigos,
  abertoId,
  onAbrir,
}: {
  artigos: ArtigoLista[];
  abertoId: string | null;
  onAbrir: (artigo: ArtigoLista) => void;
}) {
  const faixa = useRef<HTMLDivElement>(null);
  const [pode, setPode] = useState({ voltar: false, avancar: false });

  const medir = useCallback(() => {
    const el = faixa.current;
    if (!el) return;
    const voltar = el.scrollLeft > 4;
    const avancar = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setPode((atual) => (atual.voltar === voltar && atual.avancar === avancar ? atual : { voltar, avancar }));
  }, []);

  // O ResizeObserver mede na hora em que começa a observar e a cada mudança
  // de largura (janela, menu recolhido)
  useEffect(() => {
    const el = faixa.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [medir, artigos.length]);

  const rolar = (lado: 1 | -1) => {
    const el = faixa.current;
    if (el) el.scrollBy({ left: lado * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-label="Trending" className="mb-10 max-w-[720px]">
      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-foreground uppercase">
        <Icon nome="tendencia" tamanho={15} className="text-accent" />
        Trending
        <span className="h-px flex-grow bg-border" />
        <span className="font-light tracking-normal text-text-muted normal-case">últimas 12h</span>
      </h2>
      <div className="relative">
        <div
          ref={faixa}
          onScroll={medir}
          className="sem-barra -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
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

        {/* computador: setas e um esmaecido na borda que ainda tem mais */}
        {pode.voltar && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-background md:block" />
            <SetaDaFaixa lado="voltar" onClick={() => rolar(-1)} />
          </>
        )}
        {pode.avancar && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-gradient-to-l from-background md:block" />
            <SetaDaFaixa lado="avancar" onClick={() => rolar(1)} />
          </>
        )}
      </div>
    </section>
  );
}

function SetaDaFaixa({ lado, onClick }: { lado: "voltar" | "avancar"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "voltar" ? "Ver as anteriores" : "Ver mais"}
      className={`absolute top-[40%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)] transition hover:border-accent hover:text-accent active:scale-95 md:flex ${
        lado === "voltar" ? "-left-4" : "-right-4"
      }`}
    >
      <Icon nome={lado === "voltar" ? "chevronEsquerda" : "chevronDireita"} tamanho={18} />
    </button>
  );
}
