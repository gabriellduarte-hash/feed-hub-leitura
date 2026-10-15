"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/lib/erros-auth";
import { createClient } from "@/lib/supabase/client";
import { Girando, TelaAbrindoFeed } from "./Carregando";
import { Icon } from "./Icon";

/* Janela de entrar / criar conta / esqueci a senha da página de entrada.
 * Os botões da página abrem com abrirEntrar("criar") etc. */

type Modo = "entrar" | "criar" | "esqueci";
const EVENTO = "feed:entrar";

export function abrirEntrar(modo: Modo = "entrar") {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: modo }));
}

export function BotaoEntrar({ modo, className, children }: { modo: Modo; className: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => abrirEntrar(modo)} className={className}>
      {children}
    </button>
  );
}

const TITULOS: Record<Modo, string> = { entrar: "Entrar", criar: "Criar conta", esqueci: "Esqueci a senha" };

export function PainelEntrar({ aviso }: { aviso?: { texto: string; modo: Modo } }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo | null>(aviso ? aviso.modo : null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(aviso?.texto ?? null);
  const [carregando, setCarregando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [indoProGoogle, setIndoProGoogle] = useState(false);

  useEffect(() => {
    const aoAbrir = (e: Event) => {
      setModo((e as CustomEvent<Modo>).detail);
      setErro(null);
      setMensagem(null);
    };
    window.addEventListener(EVENTO, aoAbrir);
    return () => window.removeEventListener(EVENTO, aoAbrir);
  }, []);

  useEffect(() => {
    if (!modo) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setModo(null);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [modo]);

  if (!modo) return null;

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
    setMensagem(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    const supabase = createClient();
    const origem = window.location.origin;

    if (modo === "esqueci") {
      setCarregando(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origem}/auth/confirmar?next=/redefinir-senha`,
      });
      setCarregando(false);
      if (error) return setErro(mensagemDeErro(error));
      return setMensagem("Se houver uma conta com esse e-mail, mandamos um link para você criar uma senha nova.");
    }

    if (modo === "criar" && senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    setCarregando(true);
    const resposta =
      modo === "criar"
        ? await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: `${origem}/auth/confirmar?next=/` } })
        : await supabase.auth.signInWithPassword({ email, password: senha });
    if (resposta.error) {
      setCarregando(false);
      return setErro(mensagemDeErro(resposta.error));
    }
    // Com confirmação de e-mail ligada no Supabase, a conta só entra depois do link
    if (modo === "criar" && !resposta.data.session) {
      setCarregando(false);
      return setMensagem("Conta criada! Mandamos um link de confirmação para o seu e-mail.");
    }
    // Deu certo: a tela de "abrindo" fica até o feed carregar
    setEntrando(true);
    router.push("/");
    router.refresh();
  }

  /* Entrar com Google (Supabase Auth, provedor Google): o Supabase manda
   * pro Google e volta em /auth/confirmar com um código, que vira a
   * sessão. Antes de ir, confere se o Google está ligado no Supabase:
   * desligado, o Supabase mostraria uma página de erro em JSON. */
  async function entrarComGoogle() {
    setErro(null);
    setMensagem(null);
    setIndoProGoogle(true);
    const ligado = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    })
      .then((r) => r.json())
      .then((c: { external?: Record<string, boolean> }) => !!c.external?.google)
      .catch(() => false);
    if (!ligado) {
      setIndoProGoogle(false);
      return setErro("Entrar com Google ainda não está disponível. Use seu e-mail e senha por enquanto.");
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirmar?next=/` },
    });
    if (error) {
      setIndoProGoogle(false);
      setErro(mensagemDeErro(error));
    }
  }

  const campo =
    "h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-text-muted";

  if (entrando) return <TelaAbrindoFeed />;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal aria-label={TITULOS[modo]}>
      <div className="animate-aparece absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={() => setModo(null)} />
      <form
        onSubmit={enviar}
        className="animate-menu-in relative flex w-full max-w-[400px] flex-col gap-4 rounded-t-xl border border-border bg-surface p-6 pb-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] sm:rounded-xl sm:p-7"
      >
        <button
          type="button"
          onClick={() => setModo(null)}
          aria-label="Fechar"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-hover hover:text-foreground"
        >
          <Icon nome="fechar" />
        </button>
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-foreground">{TITULOS[modo]}</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {modo === "entrar" && "Que bom te ver de novo."}
            {modo === "criar" && "Grátis. Leva menos de um minuto."}
            {modo === "esqueci" && "Mandamos um link para você criar uma senha nova."}
          </p>
        </div>

        {modo !== "esqueci" && (
          <>
            <button
              type="button"
              onClick={entrarComGoogle}
              disabled={indoProGoogle}
              className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:border-text-muted disabled:opacity-60"
            >
              {indoProGoogle ? <Girando /> : <LogoGoogle />}
              Continuar com Google
            </button>
            <div className="flex items-center gap-3 text-[12px] text-text-muted">
              <span className="h-px flex-grow bg-border" />
              ou com e-mail
              <span className="h-px flex-grow bg-border" />
            </div>
          </>
        )}

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-foreground">
          E-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className={campo} />
        </label>
        {modo !== "esqueci" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="senha" className="text-[13px] font-semibold text-foreground">
                Senha
              </label>
              {modo === "entrar" && (
                <button type="button" onClick={() => trocar("esqueci")} className="text-[12px] font-medium text-accent hover:underline">
                  Esqueci a senha
                </button>
              )}
            </div>
            <input
              id="senha"
              type="password"
              required
              minLength={modo === "criar" ? 8 : undefined}
              autoComplete={modo === "criar" ? "new-password" : "current-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={modo === "criar" ? "Pelo menos 8 caracteres" : "••••••••"}
              className={campo}
            />
          </div>
        )}

        {erro && <p className="text-[13px] text-red-500">{erro}</p>}
        {mensagem && <p className="rounded-md bg-accent-soft px-3 py-2 text-[13px] text-foreground">{mensagem}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="mt-1 h-11 rounded-lg bg-foreground text-sm font-bold text-background transition-colors hover:bg-accent disabled:opacity-60"
        >
          {carregando ? (
            <span className="flex items-center justify-center gap-2.5">
              <Girando />
              {modo === "entrar" ? "Entrando…" : modo === "criar" ? "Criando conta…" : "Mandando…"}
            </span>
          ) : modo === "esqueci" ? (
            "Mandar link"
          ) : (
            TITULOS[modo]
          )}
        </button>

        <p className="text-center text-[13px] text-text-secondary">
          {modo === "entrar" && (
            <>
              Não tem conta?{" "}
              <button type="button" onClick={() => trocar("criar")} className="font-semibold text-accent">
                Criar conta
              </button>
            </>
          )}
          {modo !== "entrar" && (
            <>
              Já tem conta?{" "}
              <button type="button" onClick={() => trocar("entrar")} className="font-semibold text-accent">
                Entrar
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

/** O "G" colorido oficial do Google (as cores são as da marca). */
function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
