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
