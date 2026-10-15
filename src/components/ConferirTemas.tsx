"use client";

import { useState, useTransition } from "react";
import { pularTemas, responderTemas } from "@/app/actions/temas-avaliados";
import { Icon } from "./Icon";

export type NoticiaParaConferir = {
  id: number;
  url: string;
  titulo: string;
  trecho: string | null;
  fonte: string | null;
  categoria: string | null;
  temas: string[];
};

/** A notícia e os temas que ela ganhou: um toque marca o tema como errado
 * (riscado). "Salvar" grava os errados; os outros contam como certos. */
export function ConferirTemas({ noticia }: { noticia: NoticiaParaConferir }) {
  const [errados, setErrados] = useState<Set<string>>(new Set());
  const [faltou, setFaltou] = useState("");
  const [enviando, startTransition] = useTransition();

  function alternar(tema: string) {
    setErrados((atual) => {
      const novo = new Set(atual);
      if (novo.has(tema)) novo.delete(tema);
      else novo.add(tema);
      return novo;
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => responderTemas(noticia.id, [...errados], faltou));
      }}
      className={`flex max-w-[720px] flex-col gap-6 pb-10 ${enviando ? "opacity-60" : ""}`}
    >
      <p className="text-[13px] leading-relaxed text-text-secondary">
        Toque nos temas que <strong className="font-semibold text-foreground">não</strong> combinam com a notícia. Os outros
        contam como certos.
      </p>

      <article className="flex flex-col gap-2 rounded-md border border-border bg-surface p-5">
        <div className="text-[11.5px] font-semibold text-text-secondary">
          {noticia.fonte}
          {noticia.categoria && <span className="font-normal text-text-muted"> · #{noticia.categoria.toLowerCase()}</span>}
        </div>
        <a
          href={noticia.url}
          target="_blank"
          rel="noreferrer"
          className="group text-[17px] leading-snug font-bold text-foreground transition-colors hover:text-accent"
        >
          {noticia.titulo}
          <Icon nome="externo" tamanho={13} className="ml-1.5 inline align-baseline text-text-muted group-hover:text-accent" />
        </a>
        {noticia.trecho && <p className="line-clamp-5 text-[13px] leading-relaxed font-light text-text-secondary">{noticia.trecho}</p>}
      </article>

      <div role="group" aria-label="Temas da notícia" className="flex flex-wrap gap-2">
        {noticia.temas.map((tema) => {
          const errado = errados.has(tema);
          return (
            <button
              key={tema}
              type="button"
              aria-pressed={errado}
              onClick={() => alternar(tema)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition active:scale-95 ${
                errado
                  ? "border-red-500/60 text-red-500 line-through"
                  : "border-accent bg-accent-soft font-semibold text-accent"
              }`}
            >
              <Icon nome={errado ? "fechar" : "check"} tamanho={13} espessura={2} />#{tema.toLowerCase()}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-foreground">
        Faltou algum tema? (opcional)
        <input
          value={faltou}
          onChange={(e) => setFaltou(e.target.value)}
          placeholder="Ex.: Fofoca, Quadrinhos…"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-text-muted"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="h-10 rounded-md bg-foreground px-4 text-[13px] font-semibold text-background transition hover:bg-accent disabled:opacity-50"
        >
          {errados.size === 0 ? "Todos certos" : `Salvar (${errados.size} ${errados.size === 1 ? "errado" : "errados"})`}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => startTransition(() => pularTemas(noticia.id))}
          className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Pular
        </button>
      </div>
    </form>
  );
}
