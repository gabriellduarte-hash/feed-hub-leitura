"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemDeErro } from "@/lib/erros-auth";
import { createClient } from "@/lib/supabase/client";

/** Depois do link de "Esqueci a senha" (/auth/confirmar já abriu a sessão). */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmacao) return setErro("As duas senhas não são iguais.");
    setErro(null);
    setCarregando(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return setErro(mensagemDeErro(error));
    router.push("/");
    router.refresh();
  }

  const campo = "h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none focus:border-text-muted";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={salvar} className="flex w-full max-w-[380px] flex-col gap-4 rounded-lg border border-border bg-surface p-7">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-foreground">Crie uma senha nova</h1>
          <p className="mt-1 text-[13px] text-text-secondary">Depois disso você já entra direto no seu feed.</p>
        </div>
        <input type="password" autoComplete="new-password" placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} required />
        <input type="password" autoComplete="new-password" placeholder="Repita a nova senha" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={campo} required />
        {erro && <p className="text-[13px] text-red-500">{erro}</p>}
        <button type="submit" disabled={carregando} className="h-11 rounded-lg bg-foreground text-sm font-bold text-background transition-colors hover:bg-accent disabled:opacity-60">
          {carregando ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
    </main>
  );
}
