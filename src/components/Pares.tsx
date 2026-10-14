"use client";

import { useEffect, useTransition } from "react";
import { responderPar, type Resposta } from "@/app/actions/pares";
import { hostDe } from "@/lib/fonte";
import { Icon } from "./Icon";

export type Par = {
  id: number;
  a_url: string;
  b_url: string;
  a_titulo: string;
  b_titulo: string;
  a_fonte: string | null;
  b_fonte: string | null;
  a_trecho: string | null;
  b_trecho: string | null;
  a_quando: string | null;
  b_quando: string | null;
};

export type ParMarcado = {
  id: number;
  resposta: Resposta;
  juntou: boolean;
  nota: number;
  a_titulo: string;
  b_titulo: string;
};

const RESPOSTAS: { valor: Resposta; rotulo: string; tecla: string }[] = [
  { valor: "mesma", rotulo: "Mesma história", tecla: "1" },
  { valor: "diferente", rotulo: "Diferentes", tecla: "2" },
  { valor: "nao_sei", rotulo: "Não sei", tecla: "3" },
];

const quando = (data: string | null) =>
  data
    ? new Date(data).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/** Um par por vez: as duas notícias lado a lado (uma embaixo da outra no
 * celular) e três respostas, com atalho 1/2/3. Depois de responder, mostra
 * o que o agrupamento tinha decidido sobre o par anterior. */
export function MarcarPar({ par, anterior }: { par: Par | null; anterior: ParMarcado | null }) {
  const [enviando, startTransition] = useTransition();

  function responder(resposta: Resposta | null, id = par?.id) {
    if (id === undefined || enviando) return;
    startTransition(() => responderPar(id, resposta));
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      const escolhida = RESPOSTAS.find((r) => r.tecla === e.key);
      if (escolhida && par && !enviando) startTransition(() => responderPar(par.id, escolhida.valor));
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [par, enviando]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <p className="max-w-[680px] text-[13px] leading-relaxed text-text-secondary">
        <strong className="font-semibold text-foreground">Mesma história</strong> é o mesmo acontecimento, mesmo contado de
        outro jeito ou em outra língua (a morte de alguém e a repercussão dela; o anúncio e a reação ao anúncio).{" "}
        <strong className="font-semibold text-foreground">Diferentes</strong> é só o mesmo assunto: duas pesquisas eleitorais
        diferentes, dois jogos do mesmo time, dois episódios da mesma novela.
      </p>

      {par ? (
        <>
          <div className={`grid gap-4 lg:grid-cols-2 ${enviando ? "opacity-60" : ""}`}>
            <Noticia titulo={par.a_titulo} url={par.a_url} fonte={par.a_fonte} trecho={par.a_trecho} data={par.a_quando} />
            <Noticia titulo={par.b_titulo} url={par.b_url} fonte={par.b_fonte} trecho={par.b_trecho} data={par.b_quando} />
          </div>
          <div className="flex flex-wrap gap-2">
            {RESPOSTAS.map((r) => (
              <button
                key={r.valor}
                type="button"
                disabled={enviando}
                onClick={() => responder(r.valor)}
                className={`flex h-10 items-center gap-2 rounded-md px-4 text-[13px] font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
                  r.valor === "mesma"
                    ? "bg-foreground text-background hover:bg-accent"
                    : "border border-border text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {r.rotulo}
                <kbd className="hidden rounded border border-current/30 px-1.5 text-[10px] font-normal opacity-70 sm:inline">{r.tecla}</kbd>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-md border border-dashed border-border px-8 py-10 text-sm text-text-secondary">
          Nada pra marcar agora. A coleta sorteia mais 30 pares quando ficam menos de 20 pra marcar.
        </div>
      )}

      {anterior && <Anterior par={anterior} desfazer={() => responder(null, anterior.id)} />}
    </div>
  );
}

function Noticia({
  titulo,
  url,
  fonte,
  trecho,
  data,
}: {
  titulo: string;
  url: string;
  fonte: string | null;
  trecho: string | null;
  data: string | null;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-x-2 text-[11.5px]">
        <span className="font-semibold text-text-secondary">{fonte || hostDe(url)}</span>
        <span className="font-light text-text-muted">· {quando(data)}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group text-[16px] leading-snug font-bold text-foreground transition-colors hover:text-accent"
      >
        {titulo}
        <Icon nome="externo" tamanho={13} className="ml-1.5 inline align-baseline text-text-muted group-hover:text-accent" />
      </a>
      {trecho && <p className="line-clamp-5 text-[13px] leading-relaxed font-light text-text-secondary">{trecho}</p>}
    </article>
  );
}

function Anterior({ par, desfazer }: { par: ParMarcado; desfazer: () => void }) {
  const resposta = par.resposta === "mesma" ? "mesma história" : par.resposta === "diferente" ? "diferentes" : "não sei";
  const acertou = par.resposta === "nao_sei" ? null : (par.resposta === "mesma") === par.juntou;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-5 text-[12.5px] text-text-secondary">
      <span className="min-w-0 truncate">
        Anterior: você marcou <strong className="font-semibold text-foreground">{resposta}</strong>; o agrupamento{" "}
        {par.juntou ? "juntou" : "separou"} (nota {Math.round(par.nota)})
      </span>
      {acertou !== null && (
        <span className={`font-semibold ${acertou ? "text-accent" : "text-foreground"}`}>
          {acertou ? "· acertou" : "· errou"}
        </span>
      )}
      <button type="button" onClick={desfazer} className="underline underline-offset-2 hover:text-accent">
        Desfazer
      </button>
    </div>
  );
}
