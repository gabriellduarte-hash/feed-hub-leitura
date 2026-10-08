"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { registrarPrimeiroAcesso } from "@/app/actions/conta";
import { createClient } from "@/lib/supabase/client";
import { Icon, type NomeIcone } from "./Icon";

/* Primeiro acesso: uma janela explicando como o Daily Paper
 * funciona (uma vez só: boas_vindas_vista nos metadados do usuário) e o
 * e-mail de boas-vindas (registrarPrimeiroAcesso, também uma vez só). */

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "rss", titulo: "Siga suas fontes", texto: "Escolha entre quase mil veículos ou cole o endereço de qualquer site." },
  { icone: "camadas", titulo: "Organize em coleções", texto: "Agrupe por assunto; cada coleção vira um feed só dela." },
  { icone: "ia", titulo: "Leia o resumo", texto: "Cada notícia abre com um resumo feito por IA e o texto completo." },
  { icone: "enviar", titulo: "Receba por e-mail", texto: "Escolha o horário em Configurações › Resumo diário." },
];

export function BoasVindas({ jaViu }: { jaViu: boolean }) {
  const [aberta, setAberta] = useState(!jaViu);

  useEffect(() => {
    if (!jaViu) registrarPrimeiroAcesso().catch(() => {});
  }, [jaViu]);

  if (!aberta) return null;

  function fechar() {
    setAberta(false);
    createClient().auth.updateUser({ data: { boas_vindas_vista: true } }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal aria-label="Boas-vindas">
      <div className="animate-aparece absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={fechar} />
      <div className="animate-menu-in relative flex w-full max-w-[520px] flex-col gap-6 rounded-t-xl border border-border bg-surface p-6 pb-8 sm:rounded-xl sm:p-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-text-muted uppercase">
            <span className="text-accent">●</span>&nbsp; Boas-vindas
          </p>
          <h2 className="mt-2 text-[22px] leading-tight font-extrabold tracking-tight text-foreground">
            Suas notícias, resumidas e num só lugar
          </h2>
        </div>
        <ul className="flex flex-col gap-4">
          {PASSOS.map((p) => (
            <li key={p.titulo} className="flex gap-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Icon nome={p.icone} tamanho={17} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">{p.titulo}</p>
                <p className="text-[13px] leading-relaxed text-text-secondary">{p.texto}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={fechar}
            className="h-11 rounded-lg border border-border px-5 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            Agora não
          </button>
          <Link
            href="/explorar"
            onClick={fechar}
            className="flex h-11 items-center justify-center rounded-lg bg-foreground px-5 text-[13px] font-bold text-background transition-colors hover:bg-accent"
          >
            Seguir as primeiras fontes
          </Link>
        </div>
      </div>
    </div>
  );
}
