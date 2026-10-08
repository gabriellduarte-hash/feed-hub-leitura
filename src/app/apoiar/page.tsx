import Link from "next/link";
import { ApoiarProjeto } from "@/components/ApoiarProjeto";
import { Icon } from "@/components/Icon";

/* Página aberta (sem login): o link "Apoiar o projeto" do resumo por e-mail. */
export default function ApoiarPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 py-16 text-foreground">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
          <Icon nome="rss" tamanho={16} espessura={2.2} />
        </span>
        <span className="text-[14px] font-extrabold tracking-tight">Feed de Notícias</span>
      </Link>
      <div className="w-full max-w-[520px] rounded-xl border border-border bg-surface px-5 py-10 sm:px-10">
        <ApoiarProjeto titulo="Gostou do resumo de hoje?" />
      </div>
    </main>
  );
}
