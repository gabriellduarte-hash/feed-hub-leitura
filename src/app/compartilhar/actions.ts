"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const LIMITE_DESTINATARIOS = 10;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function adicionarDestinatario(
  _estadoAnterior: { erro: string } | undefined,
  formData: FormData,
): Promise<{ erro: string } | undefined> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !REGEX_EMAIL.test(email)) {
    return { erro: "Digite um e-mail válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada, recarregue a página." };

  const { count } = await supabase
    .from("digest_recipients")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) >= LIMITE_DESTINATARIOS) {
    return { erro: `Limite de ${LIMITE_DESTINATARIOS} destinatários atingido.` };
  }

  const { error } = await supabase
    .from("digest_recipients")
    .insert({ user_id: user.id, email });

  if (error) {
    if (error.code === "23505") {
      return { erro: "Esse e-mail já está na lista." };
    }
    return { erro: "Não deu pra adicionar. Tenta de novo." };
  }

  revalidatePath("/compartilhar");
}

export async function removerDestinatario(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("digest_recipients").delete().eq("id", id);
  revalidatePath("/compartilhar");
}
