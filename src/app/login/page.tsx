"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [avisoCadastro, setAvisoCadastro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAvisoCadastro(null);
    setCarregando(true);

    const supabase = createClient();

    const { error } = modoCadastro
      ? await supabase.auth.signUp({ email, password: senha })
      : await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    if (modoCadastro) {
      setAvisoCadastro("Conta criada. Fazendo login...");
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-[380px] flex-col gap-7">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
            >
              <path d="M4 5a15 15 0 0 1 15 15" />
              <path d="M4 11a9 9 0 0 1 9 9" />
              <circle cx="5" cy="19" r="1.4" fill="white" stroke="none" />
            </svg>
          </div>
          <div className="text-[22px] font-bold text-foreground">
            Feed de Notícias
          </div>
          <div className="text-sm text-text-secondary">
            Seus tópicos, organizados num só lugar.
          </div>
        </div>

        <form
          onSubmit={enviar}
          className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-8"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-semibold text-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-[13px] font-semibold text-foreground">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-accent"
            />
          </div>

          {erro && <p className="text-[13px] text-red-600">{erro}</p>}
          {avisoCadastro && (
            <p className="text-[13px] text-text-secondary">{avisoCadastro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-1 h-[42px] rounded-lg bg-accent text-sm font-bold text-white disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : modoCadastro ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <div className="text-center text-[13px] text-text-secondary">
          {modoCadastro ? "Já tem conta?" : "Não tem conta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setModoCadastro(!modoCadastro);
              setErro(null);
            }}
            className="font-semibold text-accent"
          >
            {modoCadastro ? "Entrar" : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
