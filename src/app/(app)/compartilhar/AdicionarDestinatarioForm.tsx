"use client";

import { useActionState } from "react";
import { adicionarDestinatario } from "./actions";

export function AdicionarDestinatarioForm() {
  const [estado, action, pendente] = useActionState(adicionarDestinatario, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@exemplo.com"
          className="h-10 flex-grow rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted"
        />
        <button
          type="submit"
          disabled={pendente}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {estado?.erro && <p className="text-xs text-red-600">{estado.erro}</p>}
    </form>
  );
}
