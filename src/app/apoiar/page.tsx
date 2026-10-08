import Link from "next/link";
import { ApoiarProjeto } from "@/components/ApoiarProjeto";
import { Logo } from "@/components/Logo";

/* Página aberta (sem login): o link "Apoiar o projeto" do resumo por e-mail. */
export default function ApoiarPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 py-16 text-foreground">
      <Link href="/" aria-label="Daily Paper">
        <Logo className="text-[20px]" />
      </Link>
      <div className="w-full max-w-[520px] rounded-xl border border-border bg-surface px-5 py-10 sm:px-10">
        <ApoiarProjeto titulo="Gostou do resumo de hoje?" />
      </div>
    </main>
  );
}
