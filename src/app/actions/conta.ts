"use server";

import { createClient } from "@/lib/supabase/server";
import { emailBoasVindas, emailFeedback, enviarEmail } from "@/lib/email";

// Provisório: o feedback vai pro e-mail do projeto (pode trocar na Vercel)
const EMAIL_DO_PROJETO = process.env.FEEDBACK_EMAIL?.trim() || "mktgabriellduarte@gmail.com";
const TIPOS = { sugestao: "Sugestão", problema: "Problema", elogio: "Elogio", outro: "Outro" } as const;
export type TipoFeedback = keyof typeof TIPOS;
const MAX_POR_HORA = 5;

/** Configurações › Feedback: grava (sql/034) e manda por e-mail pro
 * projeto, com "responder" indo direto pra pessoa. */
export async function enviarFeedback(tipo: TipoFeedback, mensagem: string): Promise<{ erro?: string }> {
  const texto = mensagem.trim();
  if (!(tipo in TIPOS)) return { erro: "Escolha o tipo do feedback." };
  if (!texto) return { erro: "Escreva sua mensagem." };
  if (texto.length > 2000) return { erro: "A mensagem pode ter até 2.000 caracteres." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const umaHoraAtras = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", umaHoraAtras);
  if ((count ?? 0) >= MAX_POR_HORA) return { erro: "Você já mandou vários feedbacks agora. Tente de novo mais tarde." };

  const { error } = await supabase.from("feedback").insert({ user_id: user.id, tipo, mensagem: texto });
  if (error) return { erro: "Não foi possível enviar. Tente de novo." };

  // O registro já está salvo: se o e-mail falhar, o feedback não se perde
  await enviarEmail({
    para: EMAIL_DO_PROJETO,
    assunto: `Feedback (${TIPOS[tipo]}) de ${user.email}`,
    html: emailFeedback({ de: user.email ?? "", tipo: TIPOS[tipo], mensagem: texto }),
    responderPara: user.email ?? undefined,
  });
  return {};
}

/** Primeiro acesso: manda o e-mail de boas-vindas uma vez só (marca nos
 * metadados do usuário, pra não repetir em outro aparelho). */
export async function registrarPrimeiroAcesso() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || user.user_metadata?.boas_vindas_email) return;
  await supabase.auth.updateUser({ data: { boas_vindas_email: new Date().toISOString() } });
  await enviarEmail({
    para: user.email,
    assunto: "Boas-vindas ao Feed de Notícias",
    html: emailBoasVindas(String(user.user_metadata?.nome ?? "")),
  });
}

/** Configurações › Conta: apaga a conta e tudo dela (sql/034). */
export async function excluirConta(): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) return { erro: "Não foi possível excluir a conta. Tente de novo." };
  // a conta já não existe: só limpa a sessão deste navegador
  await supabase.auth.signOut({ scope: "local" });
  return {};
}
