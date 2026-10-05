"use server";

import { createClient } from "@/lib/supabase/server";
import { buscarPagina, type FiltroPagina } from "@/lib/feed";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Próxima página do feed pra rolagem infinita. O filtro vem do navegador,
 * então só aceita ids no formato de UUID; a RLS garante o resto (só
 * voltam artigos do próprio usuário). */
export async function carregarMaisArtigos(filtro: FiltroPagina, offset: number) {
  const seguro: FiltroPagina = {};
  if (filtro.fonteId && UUID.test(filtro.fonteId)) seguro.fonteId = filtro.fonteId;
  if (filtro.topicoId && UUID.test(filtro.topicoId)) seguro.topicoId = filtro.topicoId;
  const inicio = Number.isInteger(offset) && offset > 0 ? offset : 0;

  const supabase = await createClient();
  return buscarPagina(supabase, seguro, inicio);
}
