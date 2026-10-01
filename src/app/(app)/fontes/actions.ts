"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarTopico(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("topics").insert({ user_id: user.id, name: nome });
  revalidatePath("/", "layout");
}

export async function adicionarFonte(
  _estadoAnterior: { erro: string } | undefined,
  formData: FormData,
): Promise<{ erro: string } | undefined> {
  const topicId = formData.get("topic_id") as string;
  const url = (formData.get("url") as string)?.trim();
  const type = formData.get("type") as string;
  const name = ((formData.get("name") as string) ?? "").trim() || null;
  if (!topicId || !url || !type) return { erro: "Preencha a URL." };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").insert({ topic_id: topicId, url, type, name });

  if (error) {
    // 23505 = unique_violation (sql/010_unique_topic_url.sql)
    if (error.code === "23505") {
      return { erro: "Essa URL já está cadastrada nesse tópico." };
    }
    return { erro: "Não deu pra adicionar a fonte. Tenta de novo." };
  }

  revalidatePath("/", "layout");
}

export async function removerFonte(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("sources").delete().eq("id", id);
  revalidatePath("/", "layout");
}
