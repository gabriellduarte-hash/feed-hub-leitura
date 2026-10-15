import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Destino dos links que o Supabase manda por e-mail (recuperar senha,
 * confirmar e-mail) e da volta do "Continuar com Google". Troca o token
 * por uma sessão e segue pra página certa (?next=/redefinir-senha).
 * Aceita os dois formatos: o token_hash (o do modelo de e-mail em
 * supabase/emails, funciona em qualquer aparelho) e o code (o padrão do
 * Supabase, que o Google também usa). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // só caminhos do próprio site (nada de redirecionar pra fora)
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // O Google devolve ?error=access_denied quando a pessoa cancela
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/login?link=google", url.origin));
  }

  const supabase = await createClient();
  let erro = true;
  if (tokenHash && tipo) {
    erro = !!(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error;
  } else if (code) {
    erro = !!(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  if (erro) {
    return NextResponse.redirect(new URL(code ? "/login?link=google" : "/login?link=invalido", url.origin));
  }
  await preencherNomeDoGoogle(supabase);
  return NextResponse.redirect(new URL(destino, url.origin));
}

/** Quem entra pelo Google chega com o nome completo (full_name) e sem o
 * nome/sobrenome do perfil (Configurações › Perfil): separa uma vez. */
async function preencherNomeDoGoogle(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata ?? {};
  const completo = String(meta.full_name ?? meta.name ?? "").trim();
  if (!user || meta.nome || !completo) return;
  const [nome, ...resto] = completo.split(/\s+/);
  await supabase.auth.updateUser({ data: { nome, sobrenome: resto.join(" ") } });
}
