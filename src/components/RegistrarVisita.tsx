"use client";

import { useEffect, useEffectEvent } from "react";
import { registrarVisita, type EscopoVisita } from "@/app/actions/visita";
import { useDadosApp, useMarcarVisitadas } from "./AppShell";

/** Posto nas páginas de feed: ao abrir, grava a visita no banco e zera o
 * contador de novas no menu na hora. */
export function RegistrarVisita({ escopo }: { escopo: EscopoVisita }) {
  const dados = useDadosApp();
  const marcarVisitadas = useMarcarVisitadas();
  const chave = escopo.tipo === "todas" ? "todas" : `${escopo.tipo}:${escopo.id}`;

  const aoVisitar = useEffectEvent(() => {
    registrarVisita(escopo).catch(() => {});
    const fontes =
      escopo.tipo === "todas"
        ? dados.colecoes.flatMap((c) => c.fontes)
        : escopo.tipo === "colecao"
          ? (dados.colecoes.find((c) => c.id === escopo.id)?.fontes ?? [])
          : dados.colecoes.flatMap((c) => c.fontes).filter((f) => f.id === escopo.id);
    marcarVisitadas(fontes.map((f) => f.id));
  });

  useEffect(() => {
    aoVisitar();
  }, [chave]);

  return null;
}
