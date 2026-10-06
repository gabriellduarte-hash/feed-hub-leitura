import type { AuthError } from "@supabase/supabase-js";

// O Supabase devolve as mensagens em inglês ("Invalid login credentials").
// Aqui viram texto em português pelo código do erro; o que não estiver na
// lista cai numa mensagem genérica.
const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  user_already_exists: "Já existe uma conta com esse e-mail. Tente entrar.",
  email_exists: "Já existe uma conta com esse e-mail. Tente entrar.",
  weak_password: "Essa senha é fácil demais. Tente uma mais longa, misturando letras e números.",
  same_password: "A nova senha precisa ser diferente da atual.",
  email_not_confirmed: "Confirme seu e-mail pelo link que enviamos antes de entrar.",
  email_address_invalid: "Esse e-mail não parece válido.",
  over_email_send_rate_limit: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
};

export function mensagemDeErro(erro: Pick<AuthError, "code">) {
  return (erro.code && MENSAGENS[erro.code]) || "Algo deu errado. Tente de novo.";
}
