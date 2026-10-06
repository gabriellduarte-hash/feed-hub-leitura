"use client";

import { useTransition } from "react";
import { deixarDeSeguir } from "@/app/actions/fontes";
import { Icon } from "@/components/Icon";
import { mostrarToast } from "@/components/Toast";

export function BotaoRemoverFonte({ id, nome }: { id: string; nome: string }) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pendente}
      aria-label={`Deixar de seguir ${nome}`}
      title="Deixar de seguir"
      onClick={() => {
        if (!window.confirm(`Deixar de seguir ${nome}? As notícias dela vão sair do seu feed.`)) return;
        startTransition(async () => {
          const resultado = await deixarDeSeguir(id, false);
          mostrarToast(resultado?.erro ?? `Você deixou de seguir ${nome}`);
        });
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted opacity-0 transition hover:bg-surface-active hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
    >
      <Icon nome="lixeira" tamanho={16} />
    </button>
  );
}
