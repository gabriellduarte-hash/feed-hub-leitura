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
          className="h-10 flex-grow rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pendente}
          className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
        >
          {pendente ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {estado?.erro && <p className="text-xs text-red-600">{estado.erro}</p>}
    </form>
  );
}
