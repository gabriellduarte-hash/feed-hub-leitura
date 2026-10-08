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
  // abertas pra quem não entrou: o link dos e-mails do Supabase e a
  // página de apoio (o link do resumo por e-mail)
  const publica = isAuthRoute || caminho.startsWith("/auth/") || caminho.startsWith("/apoiar");

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
