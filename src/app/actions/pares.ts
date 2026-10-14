"use server";

import { revalidatePath } from "next/cache";
import { ehAdmin } from "@/lib/admin";
import { clienteAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/* Amostra de pares marcada à mão (sql/045, tabela pares_avaliados): só
 * quem está em ADMIN_EMAILS marca, com a chave secreta (a tabela não abre
 * pra ninguém pelo RLS). O coletor sorteia os pares; agrupar.py --medir
 * calcula a precisão com as respostas. */

export type Resposta = "mesma" | "diferente" | "nao_sei";

async function clienteDeQuemAdministra() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return ehAdmin(user?.email) ? clienteAdmin() : null;
}

export async function responderPar(id: number, resposta: Resposta | null) {
  if (!Number.isInteger(id) || (resposta !== null && !["mesma", "diferente", "nao_sei"].includes(resposta))) return;
  const admin = await clienteDeQuemAdministra();
  if (!admin) return;
  await admin
    .from("pares_avaliados")
    .update({ resposta, respondido_em: resposta ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/relatorios/pares");
}
