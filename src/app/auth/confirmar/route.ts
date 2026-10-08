import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Destino dos links que o Supabase manda por e-mail (recuperar senha,
 * confirmar e-mail). Troca o token do link por uma sessão e segue pra
 * página certa (?next=/redefinir-senha). Aceita os dois formatos: o
 * token_hash (o do modelo de e-mail em supabase/emails, funciona em
 * qualquer aparelho) e o code (o padrão do Supabase). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // só caminhos do próprio site (nada de redirecionar pra fora)
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();
  let erro = true;
  if (tokenHash && tipo) {
    erro = !!(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error;
  } else if (code) {
    erro = !!(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  if (erro) {
    return NextResponse.redirect(new URL("/login?link=invalido", url.origin));
  }
  return NextResponse.redirect(new URL(destino, url.origin));
}
