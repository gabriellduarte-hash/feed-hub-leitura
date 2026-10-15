"use server";

import { revalidatePath } from "next/cache";
import { ehAdmin } from "@/lib/admin";
import { clienteAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* Amostra de temas conferida à mão (sql/048, tabela temas_avaliados): o
 * coletor sorteia notícias com os temas que deu; quem administra marca os
 * errados. O painel de Relatórios mostra o acerto de cada tema. */

async function clienteDeQuemAdministra() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return ehAdmin(user?.email) ? clienteAdmin() : null;
}

/** Grava a conferência: os temas errados (os outros estavam certos) e,
 * se quiser, o tema que faltou. */
export async function responderTemas(id: number, errados: string[], faltou: string) {
  if (!Number.isInteger(id) || !Array.isArray(errados)) return;
  const admin = await clienteDeQuemAdministra();
  if (!admin) return;
  await admin
    .from("temas_avaliados")
    .update({
      errados: errados.filter((t) => typeof t === "string").slice(0, 10),
      faltou: faltou.trim().slice(0, 80) || null,
      respondido_em: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/relatorios/temas");
}

/** Pular: tira a notícia da amostra (o coletor sorteia outras). */
export async function pularTemas(id: number) {
  if (!Number.isInteger(id)) return;
  const admin = await clienteDeQuemAdministra();
  if (!admin) return;
  await admin.from("temas_avaliados").delete().eq("id", id).is("respondido_em", null);
  revalidatePath("/relatorios/temas");
}
