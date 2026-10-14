"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_SEGUINDO, normalizarChave, type ItemSeguido, type SugestaoSeguir } from "@/lib/seguir";

/* Seguir temas e nomes (tabela seguindo, sql/045). A RLS garante que cada
 * um só mexe no que é seu; aqui só confere o formato do que veio do
 * navegador. */

function valido(item: ItemSeguido) {
  if (item.tipo !== "tema" && item.tipo !== "nome") return false;
  if (typeof item.chave !== "string" || typeof item.rotulo !== "string") return false;
  if (!item.chave.trim() || item.chave.length > 80 || !item.rotulo.trim() || item.rotulo.length > 80) return false;
  // nome: a chave já vem normalizada do coletor
  return item.tipo === "tema" || normalizarChave(item.chave) === item.chave;
}

export async function seguir(item: ItemSeguido): Promise<{ erro?: string }> {
  if (!valido(item)) return { erro: "Não deu pra seguir isso." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre de novo pra seguir." };

  const { count } = await supabase.from("seguindo").select("chave", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_SEGUINDO) return { erro: `Você já segue ${MAX_SEGUINDO} temas e nomes. Deixe de seguir algum antes.` };

  const { error } = await supabase
    .from("seguindo")
    .upsert(
      { user_id: user.id, tipo: item.tipo, chave: item.chave, rotulo: item.rotulo.trim() },
      { onConflict: "user_id,tipo,chave", ignoreDuplicates: true },
    );
  if (error) return { erro: "Não deu pra seguir agora. Tente de novo." };
  revalidatePath("/", "layout");
  return {};
}

export async function deixarDeSeguir(item: Pick<ItemSeguido, "tipo" | "chave">): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Entre de novo." };
  const { error } = await supabase
    .from("seguindo")
    .delete()
    .eq("user_id", user.id)
    .eq("tipo", item.tipo)
    .eq("chave", String(item.chave).slice(0, 80));
  if (error) return { erro: "Não deu pra deixar de seguir agora. Tente de novo." };
  revalidatePath("/", "layout");
  return {};
}

/** Temas e nomes citados nos últimos 3 dias (tabela sugestoes_seguir, que
 * o coletor refaz de hora em hora). Sem busca: os mais citados. */
export async function sugerirParaSeguir(busca: string): Promise<SugestaoSeguir[]> {
  const termo = normalizarChave(String(busca ?? "").slice(0, 60));
  const supabase = await createClient();
  const campos = "tipo, chave, rotulo, detalhe, noticias";
  // Temas são poucos (~25) e têm acento na chave ("Eleições"): vêm todos e
  // o filtro sem acento é aqui. Nomes têm a chave já sem acento.
  let nomes = supabase.from("sugestoes_seguir").select(campos).eq("tipo", "nome").order("noticias", { ascending: false });
  // pelo começo de uma palavra: "lula" acha "Lula" e "Luiz Inácio Lula", não "celulares"
  nomes = termo ? nomes.or(`chave.ilike.${termo}*,chave.ilike."* ${termo}*"`).limit(8) : nomes.limit(12);
  const [{ data: temas }, { data: achados }] = await Promise.all([
    supabase.from("sugestoes_seguir").select(campos).eq("tipo", "tema").order("noticias", { ascending: false }),
    nomes,
  ]);
  const temasDaBusca = ((temas ?? []) as SugestaoSeguir[]).filter(
    (t) => !termo || ` ${normalizarChave(t.rotulo)}`.includes(` ${termo}`),
  );
  const lista = [...temasDaBusca.slice(0, termo ? 4 : 6), ...((achados ?? []) as SugestaoSeguir[])];
  return lista.slice(0, termo ? 8 : 18);
}
