"use client";

import { useActionState } from "react";
import { adicionarFonte } from "./actions";

export function AdicionarFonteForm({ topicId }: { topicId: string }) {
  const [estado, action, pendente] = useActionState(adicionarFonte, undefined);

  return (
    <form action={action} className="flex flex-col gap-2 border-t border-border pt-2.5">
      <div className="flex items-center gap-2.5">
        <input type="hidden" name="topic_id" value={topicId} />
        <input
          name="url"
          required
          placeholder="URL do feed RSS ou da página"
          className="h-[38px] flex-grow rounded-lg border border-border bg-background px-3 text-[13px]"
        />
        <select
          name="type"
          className="h-[38px] rounded-lg border border-border bg-background px-2.5 text-[13px] text-text-secondary"
        >
          <option value="rss">RSS</option>
          <option value="scrape">Página (scrape)</option>
        </select>
        <button
          type="submit"
          disabled={pendente}
          className="h-[38px] rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background disabled:opacity-60"
        >
          {pendente ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {estado?.erro && <p className="text-xs text-red-600">{estado.erro}</p>}
    </form>
  );
}
