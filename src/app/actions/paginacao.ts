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
  if (filtro.catalogo === true) seguro.catalogo = true;
  if (filtro.seguindo === true) seguro.seguindo = true;
  if (
    filtro.tema &&
    (filtro.tema.tipo === "tema" || filtro.tema.tipo === "nome") &&
    typeof filtro.tema.chave === "string" &&
    filtro.tema.chave.length > 0 &&
    filtro.tema.chave.length <= 80
  )
    seguro.tema = { tipo: filtro.tema.tipo, chave: filtro.tema.chave };
  if (typeof filtro.categoria === "string" && filtro.categoria.length <= 40) seguro.categoria = filtro.categoria;
  const inicio = Number.isInteger(offset) && offset > 0 ? offset : 0;

  const supabase = await createClient();
  return buscarPagina(supabase, seguro, inicio);
}
