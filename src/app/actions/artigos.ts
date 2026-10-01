"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function usuarioLogado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Revalida o layout inteiro: o contador de não lidos do menu lateral
// mora no layout, e muda junto com qualquer artigo lido/salvo.
function atualizarTudo() {
  revalidatePath("/", "layout");
}

export async function definirLido(articleId: string, lido: boolean) {
  const { supabase, user } = await usuarioLogado();
  if (!user) return;

  if (lido) {
    await supabase
      .from("read_articles")
      .upsert({ user_id: user.id, article_id: articleId }, { ignoreDuplicates: true });
  } else {
    await supabase
      .from("read_articles")
      .delete()
      .eq("user_id", user.id)
      .eq("article_id", articleId);
  }
  atualizarTudo();
}

export async function definirSalvo(articleId: string, salvo: boolean) {
  const { supabase, user } = await usuarioLogado();
  if (!user) return;

  if (salvo) {
    await supabase
      .from("saved_articles")
      .upsert({ user_id: user.id, article_id: articleId }, { ignoreDuplicates: true });
  } else {
    await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", user.id)
      .eq("article_id", articleId);
  }
  atualizarTudo();
}

export type Escopo =
  | { tipo: "todos" }
  | { tipo: "colecao"; id: string }
  | { tipo: "fonte"; id: string }
  | { tipo: "ids"; ids: string[] };

/** "Marcar tudo como lido" — mesma janela de 30 dias do contador. */
export async function marcarTudoComoLido(escopo: Escopo) {
  const { supabase, user } = await usuarioLogado();
  if (!user) return;

  let ids: string[];
  if (escopo.tipo === "ids") {
    ids = escopo.ids;
  } else {
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let consulta = supabase.from("articles").select("id, sources!inner(topic_id)").gte("collected_at", desde);
    if (escopo.tipo === "fonte") consulta = consulta.eq("source_id", escopo.id);
    if (escopo.tipo === "colecao") consulta = consulta.eq("sources.topic_id", escopo.id);
    const { data } = await consulta;
    ids = (data ?? []).map((a) => a.id as string);
  }
  if (ids.length === 0) return;

  await supabase
    .from("read_articles")
    .upsert(
      ids.map((id) => ({ user_id: user.id, article_id: id })),
      { ignoreDuplicates: true },
    );
  atualizarTudo();
}
