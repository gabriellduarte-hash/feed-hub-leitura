import { createClient } from "@supabase/supabase-js";

/** Cliente com a chave secreta do Supabase: passa por cima do RLS. Só
 * no servidor (server actions), e só pra gravar o que o próprio servidor
 * buscou, como as notícias coletadas na hora em que alguém segue um feed
 * novo. Com o feed compartilhado (sql/038), o usuário não pode gravar
 * notícia direto: outra pessoa que siga o mesmo feed leria o que ele
 * inventasse.
 *
 * SUPABASE_SECRET_KEY: Supabase › Project Settings › API Keys › Secret
 * keys (sb_secret_...). Na Vercel, marcada como Sensitive. Sem ela, devolve
 * null e a coleta fica pro workflow "Fonte nova" e pra rodada de hora em
 * hora. */
export function clienteAdmin() {
  const chave = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!chave) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
