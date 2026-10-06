"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adicionarFonte, type ResultadoAdicionar } from "@/app/actions/adicionar-fonte";
import { resumoDaAdicao } from "../explorar/Seguir";

const campo =
  "h-9 rounded-md border border-border bg-surface px-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted";

/** Adiciona uma fonte direto numa coleção. O tipo (RSS, sitemap, Google
 * Notícias, página) é detectado sozinho, igual ao "Seguir por URL". */
export function AdicionarFonteForm({ topicId }: { topicId: string }) {
  const [pendente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAdicionar | null>(null);

  function enviar(dados: FormData) {
    setResultado(null);
    startTransition(async () => {
      setResultado(
        await adicionarFonte({
          url: String(dados.get("url") ?? ""),
          nome: String(dados.get("nome") ?? ""),
          topicId,
        }),
      );
    });
  }

  return (
    <form action={enviar} className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input name="url" required placeholder="Endereço do site ou do feed" className={`${campo} flex-grow`} />
        <input name="nome" placeholder="Nome (opcional)" className={`${campo} w-40`} />
        <button
          type="submit"
          disabled={pendente}
          className="h-9 rounded-md border border-border px-3.5 text-[13px] text-foreground transition hover:bg-surface-hover active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Analisando…" : "Adicionar"}
        </button>
      </div>
      {resultado?.erro && <p className="text-xs text-red-500">{resultado.erro}</p>}
      {resultado?.fonteId && !resultado.erro && (
        <p className="animate-fade-up text-xs text-text-secondary">
          ✓ {resultado.nome}: {resultado.como} · {resumoDaAdicao(resultado)}
          {resultado.coletaCompleta && !resultado.coletaCompleta.ok && (
            <span className="text-amber-500"> · disparo da coleta falhou: {resultado.coletaCompleta.motivo}</span>
          )}{" "}
          <Link href={`/feeds/fonte/${resultado.fonteId}`} className="text-accent hover:underline">
            ver notícias →
          </Link>
        </p>
      )}
    </form>
  );
}
