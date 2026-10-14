"use client";

import { useEffect, useRef, useState } from "react";
import { sugerirParaSeguir } from "@/app/actions/seguir";
import { idDoItem, type ItemSeguido, type SugestaoSeguir } from "@/lib/seguir";
import { Icon } from "./Icon";
import { ChipSeguir, useSeguindo } from "./Seguindo";

const TIPOS: Record<string, string> = {
  pessoa: "pessoa",
  "organização": "organização",
  lugar: "lugar",
  outro: "nome",
};

function detalheDa(s: SugestaoSeguir) {
  const tipo = s.tipo === "tema" ? `tema de ${s.detalhe ?? "notícias"}` : (TIPOS[s.detalhe ?? ""] ?? "nome");
  return `${tipo} · ${s.noticias.toLocaleString("pt-BR")} ${s.noticias === 1 ? "notícia" : "notícias"} em 3 dias`;
}

const comoItem = (s: SugestaoSeguir): ItemSeguido => ({ tipo: s.tipo, chave: s.chave, rotulo: s.rotulo });

/** Topo da aba Seguindo: o que a pessoa segue, a busca pra seguir mais e,
 * sem busca, os temas e nomes mais citados nos últimos 3 dias. */
export function PainelSeguindo({ emAlta }: { emAlta: SugestaoSeguir[] }) {
  const { itens, segue, alternar } = useSeguindo();
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<SugestaoSeguir[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [aberta, setAberta] = useState(false);
  const ultimaBusca = useRef(0);

  // Busca enquanto digita, com uma pausa pra não consultar a cada letra
  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < 2) return;
    const numero = ++ultimaBusca.current;
    const timer = setTimeout(async () => {
      const achados = await sugerirParaSeguir(busca).catch(() => []);
      if (numero === ultimaBusca.current) {
        setResultados(achados);
        setIndice(0);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [termo]);

  const lista = aberta && termo.trim().length >= 2 ? resultados : null;
  const sugeridos = emAlta.filter((s) => !segue(s)).slice(0, 14);

  return (
    <div className="-mt-2 mb-10 flex max-w-[720px] flex-col gap-5">
      <div className="relative">
        <div className="flex h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3.5 transition-colors focus-within:border-accent">
          <Icon nome="buscar" tamanho={17} className="flex-shrink-0 text-text-muted" />
          <input
            value={termo}
            onFocus={() => setAberta(true)}
            onBlur={() => setAberta(false)}
            onChange={(e) => {
              setAberta(true);
              setTermo(e.target.value);
              if (e.target.value.trim().length < 2) setResultados(null);
            }}
            onKeyDown={(e) => {
              if (!lista?.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndice((i) => Math.min(i + 1, lista.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndice((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                alternar(comoItem(lista[indice]));
              } else if (e.key === "Escape") {
                setTermo("");
                setResultados(null);
              }
            }}
            placeholder="Seguir tema, pessoa, time…"
            aria-label="Buscar tema ou nome pra seguir"
            className="h-full min-w-0 flex-grow bg-transparent text-[14px] text-foreground outline-none placeholder:text-text-muted"
          />
          {termo && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setTermo("");
                setResultados(null);
              }}
              className="flex-shrink-0 text-text-muted transition-colors hover:text-foreground"
            >
              <Icon nome="fechar" tamanho={15} />
            </button>
          )}
        </div>

        {lista && (
          // mousedown sem tirar o foco do campo: o clique na lista não fecha a lista
          <ul
            onMouseDown={(e) => e.preventDefault()}
            className="animate-menu-in absolute inset-x-0 top-12 z-20 max-h-[50vh] overflow-y-auto rounded-md border border-border bg-surface p-1.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
            {lista.length === 0 && (
              <li className="px-3 py-5 text-center text-[13px] text-text-muted">
                Nada citado nos últimos 3 dias com “{termo.trim()}”.
              </li>
            )}
            {lista.map((s, i) => {
              const ativo = segue(s);
              return (
                <li key={idDoItem(s)}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => alternar(comoItem(s))}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                      i === indice ? "bg-surface-hover" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-grow">
                      <span className="block truncate text-[14px] font-semibold text-foreground">
                        {s.tipo === "tema" ? `#${s.rotulo.toLowerCase()}` : s.rotulo}
                      </span>
                      <span className="block truncate text-[11.5px] text-text-muted">{detalheDa(s)}</span>
                    </span>
                    <span
                      className={`flex h-7 flex-shrink-0 items-center gap-1 rounded-md px-2.5 text-[12px] font-semibold ${
                        ativo ? "bg-accent-soft text-accent" : "border border-border text-text-secondary"
                      }`}
                    >
                      <Icon nome={ativo ? "check" : "adicionar"} tamanho={13} espessura={2} />
                      {ativo ? "Seguindo" : "Seguir"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {itens.length > 0 && (
        <section aria-label="Você segue" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">Você segue</h2>
          <div className="flex flex-wrap gap-2">
            {itens.map((item) => (
              <ChipSeguir key={idDoItem(item)} item={item} />
            ))}
          </div>
        </section>
      )}

      {sugeridos.length > 0 && (
        <section aria-label="Em alta" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            {itens.length > 0 ? "Mais citados nos últimos 3 dias" : "Comece por um destes"}
          </h2>
          <div className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {sugeridos.map((s) => (
              <span key={idDoItem(s)} className="flex-shrink-0 sm:flex-shrink">
                <ChipSeguir item={comoItem(s)} />
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
