import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// No Next.js 16 o antigo "middleware.ts" virou "proxy.ts" (mesma função,
// nome novo). Isso aqui renova a sessão do Supabase a cada request e
// redireciona pra /login quem não estiver autenticado.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const isAuthRoute = caminho.startsWith("/login");
  // abertas pra quem não entrou: o link dos e-mails do Supabase, a
  // página de apoio (o link do resumo por e-mail) e a de privacidade (o
  // Google pede o link no "Continuar com Google")
  // a rota de coleta tem a própria senha (COLETA_SECRET), chamada pelo GitHub
  const publica =
    isAuthRoute ||
    caminho.startsWith("/auth/") ||
    caminho.startsWith("/apoiar") ||
    caminho.startsWith("/privacidade") ||
    caminho === "/api/coletar-bloqueados";

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // manifest.webmanifest fica de fora: o navegador busca sem a sessão, e o
    // redirecionamento pro /login impediria instalar o app
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
