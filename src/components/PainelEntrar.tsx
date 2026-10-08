"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/lib/erros-auth";
import { createClient } from "@/lib/supabase/client";
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
    setCarregando(false);
    if (resposta.error) return setErro(mensagemDeErro(resposta.error));
    // Com confirmação de e-mail ligada no Supabase, a conta só entra depois do link
    if (modo === "criar" && !resposta.data.session) {
      return setMensagem("Conta criada! Mandamos um link de confirmação para o seu e-mail.");
    }
    setMensagem(modo === "criar" ? "Conta criada! Entrando…" : null);
    router.push("/");
    router.refresh();
  }

  const campo =
    "h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-text-muted";

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

        {erro && <p className="text-[13px] text-red-600">{erro}</p>}
        {mensagem && <p className="rounded-md bg-accent-soft px-3 py-2 text-[13px] text-foreground">{mensagem}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="mt-1 h-11 rounded-lg bg-foreground text-sm font-bold text-background transition-colors hover:bg-accent disabled:opacity-60"
        >
          {carregando ? "Aguarde…" : modo === "esqueci" ? "Mandar link" : TITULOS[modo]}
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
