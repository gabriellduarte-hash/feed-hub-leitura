"use server";

import { createClient } from "@/lib/supabase/server";

export type EscopoVisita = { tipo: "todas" } | { tipo: "colecao"; id: string } | { tipo: "fonte"; id: string };

/** Abriu o feed todo, uma coleção ou uma fonte: zera o contador de novas
 * delas (sources.visto_em, sql/038). Sem revalidar a página: o menu zera
 * na hora pelo AppShell, e a próxima carga já vem do banco certa. */
export async function registrarVisita(escopo: EscopoVisita) {
  const supabase = await createClient();
  await supabase.rpc("registrar_visita", {
    p_fonte: escopo.tipo === "fonte" ? escopo.id : null,
    p_topico: escopo.tipo === "colecao" ? escopo.id : null,
  });
}
