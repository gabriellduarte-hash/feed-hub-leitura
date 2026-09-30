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
  revalidatePath("/fontes");
}

export async function adicionarFonte(formData: FormData) {
  const topicId = formData.get("topic_id") as string;
  const url = (formData.get("url") as string)?.trim();
  const type = formData.get("type") as string;
  if (!topicId || !url || !type) return;

  const supabase = await createClient();
  await supabase.from("sources").insert({ topic_id: topicId, url, type });
  revalidatePath("/fontes");
}

export async function removerFonte(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("sources").delete().eq("id", id);
  revalidatePath("/fontes");
}
