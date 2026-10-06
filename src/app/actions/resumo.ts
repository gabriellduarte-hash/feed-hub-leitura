"use server";

import { createClient } from "@/lib/supabase/server";

const LIMITE_DESTINATARIOS = 10;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConfigResumo = {
  ativo: boolean;
  horaEnvio: number;
  /** null = todas as coleções */
  topicIds: string[] | null;
};
export type Destinatario = { id: string; email: string };

/** Sem linha em digest_settings = padrão do enviar.py (ligado, 6h, todas). */
const PADRAO: ConfigResumo = { ativo: true, horaEnvio: 6, topicIds: null };

export async function carregarResumo(): Promise<{
  config: ConfigResumo;
  destinatarios: Destinatario[];
  limite: number;
}> {
  const supabase = await createClient();
  const [{ data: config }, { data: destinatarios }] = await Promise.all([
    supabase.from("digest_settings").select("ativo, hora_envio, topic_ids").maybeSingle(),
    supabase.from("digest_recipients").select("id, email").order("created_at"),
  ]);
  return {
    config: config
      ? { ativo: config.ativo, horaEnvio: config.hora_envio, topicIds: config.topic_ids }
      : PADRAO,
    destinatarios: (destinatarios ?? []) as Destinatario[],
    limite: LIMITE_DESTINATARIOS,
  };
}

export async function salvarConfigResumo(config: ConfigResumo): Promise<{ erro?: string }> {
  const hora = Math.trunc(Number(config.horaEnvio));
  if (!(hora >= 0 && hora <= 23)) return { erro: "Horário inválido." };
  const topicIds = config.topicIds === null ? null : config.topicIds.filter((id) => UUID.test(id));
  if (topicIds && topicIds.length === 0) return { erro: 'Escolha pelo menos uma coleção ou marque "Todas as coleções".' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { error } = await supabase.from("digest_settings").upsert({
    user_id: user.id,
    ativo: !!config.ativo,
    hora_envio: hora,
    topic_ids: topicIds,
    updated_at: new Date().toISOString(),
  });
  return error ? { erro: "Não foi possível salvar. Tente de novo." } : {};
}

export async function adicionarDestinatario(email: string): Promise<{ erro?: string; destinatario?: Destinatario }> {
  const limpo = email.trim().toLowerCase();
  if (!REGEX_EMAIL.test(limpo)) return { erro: "Digite um e-mail válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  if (limpo === user.email?.toLowerCase()) return { erro: "Esse é o seu e-mail, e você já recebe o resumo." };

  const { count } = await supabase.from("digest_recipients").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= LIMITE_DESTINATARIOS) return { erro: `Você já adicionou o máximo de ${LIMITE_DESTINATARIOS} pessoas.` };

  const { data, error } = await supabase
    .from("digest_recipients")
    .insert({ user_id: user.id, email: limpo })
    .select("id, email")
    .single();
  if (error) return { erro: error.code === "23505" ? "Esse e-mail já está na lista." : "Não foi possível adicionar. Tente de novo." };
  return { destinatario: data as Destinatario };
}

export async function removerDestinatario(id: string): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("digest_recipients").delete().eq("id", id).select("id");
  return data && data.length > 0 ? {} : { erro: "Não foi possível remover. Tente de novo." };
}
