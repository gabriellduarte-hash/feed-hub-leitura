"use server";

import { createClient } from "@/lib/supabase/server";

/* Estatísticas de uso (sql/043): o mínimo pra saber o que as pessoas leem,
 * buscam e seguem, e decidir o que entra no catálogo. Só agregado: o
 * relatório nunca mostra o que uma pessoa fez. Falhar aqui nunca pode
 * atrapalhar quem está lendo, então os erros são engolidos. */

export type OrigemAbertura = "feed" | "explorar" | "trending" | "busca" | "salvos" | "lidos" | "seguindo";

const corta = (texto: string | null | undefined, maximo: number) => (texto ? texto.slice(0, maximo) : null);

export async function registrarAbertura(dados: {
  origem: OrigemAbertura;
  categoria: string | null;
  fonte: string | null;
  noticiaId: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("eventos").insert({
      user_id: user.id,
      tipo: "abriu",
      origem: dados.origem,
      categoria: corta(dados.categoria, 40),
      fonte: corta(dados.fonte, 300),
      noticia_id: /^[0-9a-f-]{36}$/i.test(dados.noticiaId) ? dados.noticiaId : null,
    });
  } catch {
    // estatística não é motivo pra dar erro
  }
}
