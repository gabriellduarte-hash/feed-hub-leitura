"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Topico = { id: string; name: string };

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d={path} />
    </svg>
  );
}

const ICONES = {
  inicio:
    "M3 11.5L12 4l9 7.5 M5 10.5V19a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-8.5",
  buscar: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-4.7-4.7",
  fontes: "M4 5a15 15 0 0 1 15 15 M4 11a9 9 0 0 1 9 9",
};

function ItemNav({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-2.5 py-2 text-[13px] font-semibold ${
        ativo ? "bg-accent-soft text-accent" : "text-text-secondary"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ topicos }: { topicos: Topico[] }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const emFontes = pathname.startsWith("/fontes");
  const emInicio = !emFontes;

  return (
    <div className="flex h-full w-[304px] flex-shrink-0 bg-background">
      {/* Trilho de ícones */}
      <div className="flex w-16 flex-shrink-0 flex-col items-center gap-5 border-r border-border py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
          <NavIcon path="M4 5a15 15 0 0 1 15 15 M4 11a9 9 0 0 1 9 9" />
        </div>

        <div className="mt-1 flex flex-col gap-1.5">
          <Link
            href="/"
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              emInicio ? "bg-accent-soft text-accent" : "text-text-secondary"
            }`}
          >
            <NavIcon path={ICONES.inicio} />
          </Link>
          <Link
            href="/fontes"
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              emFontes ? "bg-accent-soft text-accent" : "text-text-secondary"
            }`}
          >
            <NavIcon path={ICONES.fontes} />
          </Link>
        </div>

        <div className="flex-grow" />

        <button
          onClick={sair}
          title="Sair"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
        >
          <NavIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
        </button>
      </div>

      {/* Painel expansível */}
      <div className="flex w-60 flex-shrink-0 flex-col gap-1 overflow-y-auto p-4">
        <div className="mb-3 text-sm font-bold text-foreground">
          Feed de Notícias
        </div>

        <ItemNav href="/" ativo={emInicio}>
          Início
        </ItemNav>
        <ItemNav href="/fontes" ativo={emFontes}>
          Gerenciar fontes
        </ItemNav>

        <div className="mono mt-4 mb-1.5 px-2.5 text-[10px] font-bold tracking-wider text-text-muted uppercase">
          Meus tópicos
        </div>

        {topicos.length === 0 && (
          <div className="px-2.5 py-1.5 text-[13px] text-text-muted">
            Nenhum tópico ainda
          </div>
        )}
        {topicos.map((topico) => (
          <div
            key={topico.id}
            className="rounded-lg px-2.5 py-2 text-[13px] text-text-secondary"
          >
            {topico.name}
          </div>
        ))}
      </div>
    </div>
  );
}
