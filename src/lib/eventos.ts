import type { SupabaseClient } from "@supabase/supabase-js";

/* Gravação de eventos do lado do servidor (páginas e server actions que
 * já têm o cliente com a sessão). Ver sql/043 e app/actions/eventos.ts. */

/** Seguiu ou deixou de seguir um feed, e por qual caminho. */
export async function registrarSeguir(
  supabase: SupabaseClient,
  userId: string,
  evento: { tipo: "seguiu" | "deixou_de_seguir"; origem: string; fonte: string; categoria?: string | null },
) {
  try {
    await supabase.from("eventos").insert({
      user_id: userId,
      tipo: evento.tipo,
      origem: evento.origem.slice(0, 20),
      fonte: evento.fonte.slice(0, 300),
      categoria: evento.categoria?.slice(0, 40) ?? null,
    });
  } catch {
    // estatística não é motivo pra dar erro
  }
}

/** Busca de notícias ou de fontes. A mesma busca na mesma meia hora conta
 * uma vez (a página recarrega ao seguir uma fonte): ver registrar_busca. */
export async function registrarBusca(
  supabase: SupabaseClient,
  busca: { origem: "noticias" | "fontes"; termo: string; resultados: number },
) {
  try {
    await supabase.rpc("registrar_busca", { p_termo: busca.termo, p_origem: busca.origem, p_resultados: busca.resultados });
  } catch {
    // estatística não é motivo pra dar erro
  }
}
