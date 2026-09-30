"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function salvarArtigo(formData: FormData) {
  const articleId = formData.get("article_id") as string;
  const path = formData.get("path") as string;
  if (!articleId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("saved_articles").insert({ user_id: user.id, article_id: articleId });
  if (path) revalidatePath(path);
}

export async function removerSalvo(formData: FormData) {
  const articleId = formData.get("article_id") as string;
  const path = formData.get("path") as string;
  if (!articleId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_articles")
    .delete()
    .eq("user_id", user.id)
    .eq("article_id", articleId);
  if (path) revalidatePath(path);
}
