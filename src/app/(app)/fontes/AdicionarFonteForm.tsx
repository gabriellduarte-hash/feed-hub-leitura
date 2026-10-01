"use client";

import { useActionState } from "react";
import { adicionarFonte } from "./actions";

const campo =
  "h-9 rounded-md border border-border bg-surface px-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted";

export function AdicionarFonteForm({ topicId }: { topicId: string }) {
  const [estado, action, pendente] = useActionState(adicionarFonte, undefined);

  return (
    <form action={action} className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input type="hidden" name="topic_id" value={topicId} />
        <input name="url" required placeholder="URL do feed RSS ou da página" className={`${campo} flex-grow`} />
        <input name="name" placeholder="Nome (opcional)" className={`${campo} w-40`} />
        <select name="type" className={`${campo} text-text-secondary`}>
          <option value="rss">RSS</option>
          <option value="scrape">Página</option>
        </select>
        <button
          type="submit"
          disabled={pendente}
          className="h-9 rounded-md border border-border px-3.5 text-[13px] text-foreground transition hover:bg-surface-hover active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {estado?.erro && <p className="text-xs text-red-500">{estado.erro}</p>}
    </form>
  );
}
