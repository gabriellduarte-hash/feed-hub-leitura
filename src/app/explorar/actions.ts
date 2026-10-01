"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Segue um feed do catálogo: cria (ou reaproveita) um tópico com o
 * nome da categoria, e adiciona o feed como fonte dentro dele — sem
 * o usuário precisar ir em "Gerenciar fontes" preencher nada à mão. */
export async function seguirFeedDoCatalogo(formData: FormData) {
  const category = formData.get("category") as string;
  const url = formData.get("url") as string;
  if (!category || !url) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: topicoExistente } = await supabase
    .from("topics")
    .select("id")
    .eq("name", category)
    .maybeSingle();

  let topicId = topicoExistente?.id as string | undefined;

  if (!topicId) {
    const { data: novoTopico, error } = await supabase
      .from("topics")
      .insert({ user_id: user.id, name: category })
      .select("id")
      .single();
    if (error) return;
    topicId = novoTopico.id;
  }

  // Se já segue esse feed (unique(topic_id, url)), ignora o erro de
  // duplicata — clicar em "Seguir" de novo não deve quebrar nada.
  const { error } = await supabase.from("sources").insert({
    topic_id: topicId,
    url,
    type: "rss",
  });
  if (error && error.code !== "23505") return;

  revalidatePath("/explorar");
  revalidatePath("/fontes");
}
