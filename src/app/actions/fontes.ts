"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { erro?: string } | undefined;

// Com RLS, um UPDATE/DELETE que nenhuma policy permite não dá erro: só
// afeta 0 linhas. Por isso toda ação pede as linhas de volta (.select)
// e trata "nenhuma linha" como falha, em vez de fingir que deu certo.
function conferir(
  resposta: { data: unknown[] | null; error: { code?: string } | null },
  semPermissao: string,
): Resultado {
  if (resposta.error?.code === "23505") return { erro: "Essa coleção já segue essa fonte." };
  if (resposta.error) return { erro: "Algo deu errado. Tenta de novo." };
  if (!resposta.data || resposta.data.length === 0) return { erro: semPermissao };
  revalidatePath("/", "layout");
}

export async function renomearFonte(id: string, nome: string): Promise<Resultado> {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await createClient();
  return conferir(
    await supabase.from("sources").update({ name: limpo }).eq("id", id).select("id"),
    "Não foi possível renomear a fonte.",
  );
}

export async function definirFavorita(id: string, favorita: boolean): Promise<Resultado> {
  const supabase = await createClient();
  return conferir(
    await supabase.from("sources").update({ favorite: favorita }).eq("id", id).select("id"),
    "Não foi possível atualizar os favoritos.",
  );
}

export async function moverFonte(id: string, topicId: string): Promise<Resultado> {
  const supabase = await createClient();
  return conferir(
    await supabase.from("sources").update({ topic_id: topicId }).eq("id", id).select("id"),
    "Não foi possível mover a fonte.",
  );
}

export async function deixarDeSeguir(id: string, estavaNaPagina: boolean): Promise<Resultado> {
  const supabase = await createClient();
  const resultado = conferir(
    await supabase.from("sources").delete().eq("id", id).select("id"),
    "Não foi possível deixar de seguir (sem permissão no banco).",
  );
  if (!resultado && estavaNaPagina) redirect("/feeds/todos");
  return resultado;
}

export async function renomearColecao(id: string, nome: string): Promise<Resultado> {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await createClient();
  return conferir(
    await supabase.from("topics").update({ name: limpo }).eq("id", id).select("id"),
    "Não foi possível renomear a coleção.",
  );
}

export async function excluirColecao(id: string, estavaNaPagina: boolean): Promise<Resultado> {
  const supabase = await createClient();
  // cascade: apaga as fontes da coleção e os artigos delas
  const resultado = conferir(
    await supabase.from("topics").delete().eq("id", id).select("id"),
    "Não foi possível excluir a coleção.",
  );
  if (!resultado && estavaNaPagina) redirect("/feeds/todos");
  return resultado;
}
