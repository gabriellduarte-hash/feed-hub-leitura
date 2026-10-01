"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function atualizarTudo() {
  revalidatePath("/", "layout");
}

export async function renomearFonte(id: string, nome: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await createClient();
  await supabase.from("sources").update({ name: limpo }).eq("id", id);
  atualizarTudo();
}

export async function definirFavorita(id: string, favorita: boolean) {
  const supabase = await createClient();
  await supabase.from("sources").update({ favorite: favorita }).eq("id", id);
  atualizarTudo();
}

export async function moverFonte(id: string, topicId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sources").update({ topic_id: topicId }).eq("id", id);
  // 23505: a coleção de destino já segue essa mesma URL
  if (error?.code === "23505") return { erro: "Essa coleção já segue essa fonte." };
  atualizarTudo();
}

export async function deixarDeSeguir(id: string, estavaNaPagina: boolean) {
  const supabase = await createClient();
  await supabase.from("sources").delete().eq("id", id);
  atualizarTudo();
  if (estavaNaPagina) redirect("/feeds/todos");
}

export async function renomearColecao(id: string, nome: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await createClient();
  await supabase.from("topics").update({ name: limpo }).eq("id", id);
  atualizarTudo();
}

export async function excluirColecao(id: string, estavaNaPagina: boolean) {
  const supabase = await createClient();
  // cascade: apaga as fontes da coleção e os artigos delas
  await supabase.from("topics").delete().eq("id", id);
  atualizarTudo();
  if (estavaNaPagina) redirect("/feeds/todos");
}
