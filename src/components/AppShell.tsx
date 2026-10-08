"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { faviconDe } from "@/lib/fonte";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon, type NomeIcone } from "./Icon";
import { Sidebar, type DadosSidebar } from "./Sidebar";
import { BoasVindas } from "./BoasVindas";
import { Logo, LogoReduzida } from "./Logo";
import { abrirConfiguracoes, Configuracoes, estiloAvatar } from "./Configuracoes";
import { Toaster } from "./Toast";
import { BarraDeProgresso } from "./BarraDeProgresso";

// Coleções, fontes e perfil, pra páginas que mostram a mesma coisa que o
// menu lateral (no celular, a página Feeds) sem buscar tudo de novo
const DadosApp = createContext<DadosSidebar | null>(null);

export function useDadosApp() {
  const dados = useContext(DadosApp);
  if (!dados) throw new Error("useDadosApp fora do AppShell");
  return dados;
}

export function AppShell({ dados, children }: { dados: DadosSidebar; children: React.ReactNode }) {
  const [valorRecolhido, setValorRecolhido] = useLocalStorage("sidebar-recolhida", "0");
  const recolhido = valorRecolhido === "1";
  const [irParaAberto, setIrParaAberto] = useState(false);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIrParaAberto((a) => !a);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  function alternar() {
    setValorRecolhido(recolhido ? "0" : "1");
  }

  return (
    <DadosApp.Provider value={dados}>
    <div
      className="flex h-[100dvh] bg-background"
      // O leitor de artigos centraliza no espaço à direita do menu: ele lê
      // a largura atual do menu por esta variável (aberto ou recolhido).
      style={{ "--largura-menu": recolhido ? "72px" : "264px" } as React.CSSProperties}
    >
      {/* computador: menu lateral fixo */}
      <div className="hidden md:flex">
        <Sidebar dados={dados} recolhido={recolhido} onAlternar={alternar} onIrPara={() => setIrParaAberto(true)} />
      </div>

      <div className="flex min-w-0 flex-grow flex-col">
        <BarraTopoMobile />
        <main className="relative min-w-0 flex-grow overflow-y-auto">{children}</main>
        <BarraAbasMobile dados={dados} />
      </div>

      {irParaAberto && <IrPara dados={dados} onFechar={() => setIrParaAberto(false)} />}
      <Configuracoes
        email={dados.email}
        perfil={dados.perfil}
        colecoes={dados.colecoes.map((c) => ({ id: c.id, nome: c.nome }))}
      />
      <BoasVindas jaViu={!!dados.perfil.boasVindasVista} />
      <Toaster />
      <Suspense fallback={null}>
        <BarraDeProgresso />
      </Suspense>
    </div>
    </DadosApp.Provider>
  );
}

/* ------------------------------------------------------------------ mobile */

function BarraTopoMobile() {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo className="text-[16px]" />
      </Link>
      <Link
        href="/explorar"
        aria-label="Seguir fontes"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-accent transition-colors active:bg-accent-soft"
      >
        <Icon nome="adicionar" tamanho={18} espessura={2} />
      </Link>
    </header>
  );
}

/* Abas do celular: Feeds (coleções e fontes) na ponta esquerda, o Feed
 * (início, com a logo) no meio. */
function BarraAbasMobile({ dados }: { dados: DadosSidebar }) {
  const pathname = usePathname();
  const inicial = (dados.perfil.nome || dados.email).charAt(0).toUpperCase();
  const noFeed = pathname === "/";
  return (
    <nav className="flex flex-shrink-0 items-stretch justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <AbaMobile href="/feeds" icone="camadas" rotulo="Feeds" ativo={pathname.startsWith("/feeds") || pathname === "/fontes"} />
      <AbaMobile href="/buscar" icone="buscar" rotulo="Buscar" ativo={pathname.startsWith("/buscar")} />
      <Link
        href="/"
        aria-current={noFeed ? "page" : undefined}
        className={`flex w-16 flex-col items-center gap-1 pb-2 text-[10px] ${noFeed ? "font-bold text-foreground" : "font-medium text-text-muted"}`}
      >
        <span className={`h-[2px] w-5 rounded-full ${noFeed ? "bg-accent" : "bg-transparent"}`} />
        <LogoReduzida tamanho={21} className={noFeed ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""} />
        Feed
      </Link>
      <AbaMobile href="/ler-mais-tarde" icone="marcador" rotulo="Salvos" ativo={pathname.startsWith("/ler-mais-tarde")} />
      <button
        type="button"
        onClick={() => abrirConfiguracoes("geral")}
        className="flex w-16 flex-col items-center gap-1 pb-2 text-[10px] font-medium text-text-muted"
      >
        <span className="h-[2px] w-5" />
        <span
          className="flex h-[21px] w-[21px] items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={estiloAvatar(dados.perfil.cor)}
        >
          {inicial}
        </span>
        Conta
      </button>
    </nav>
  );
}

function AbaMobile({ href, icone, rotulo, ativo }: { href: string; icone: NomeIcone; rotulo: string; ativo: boolean }) {
  const conteudo = (
    <>
      <span className={`h-[2px] w-5 rounded-full transition-colors ${ativo ? "bg-accent" : "bg-transparent"}`} />
      <Icon nome={icone} tamanho={21} preenchido={ativo && icone === "marcador"} />
      <span className={ativo ? "font-bold" : "font-medium"}>{rotulo}</span>
    </>
  );
  const classe = `flex w-16 flex-col items-center gap-1 pb-2 text-[10px] transition-colors ${
    ativo ? "text-foreground" : "text-text-muted active:text-foreground"
  }`;
  return (
    <Link href={href} aria-current={ativo ? "page" : undefined} className={classe}>
      {conteudo}
    </Link>
  );
}

type Destino = { rotulo: string; href: string; icone?: NomeIcone; favicon?: string; detalhe?: string };

function IrPara({ dados, onFechar }: { dados: DadosSidebar; onFechar: () => void }) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [indice, setIndice] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const destinos = useMemo<Destino[]>(
    () => [
      { rotulo: "Hoje", href: "/", icone: "casa" },
      { rotulo: "Todos", href: "/feeds/todos", icone: "camadas" },
      { rotulo: "Ler mais tarde", href: "/ler-mais-tarde", icone: "marcador" },
      { rotulo: "Lidos recentemente", href: "/lidos-recentemente", icone: "relogio" },
      { rotulo: "Seguir fontes", href: "/explorar", icone: "rss" },
      { rotulo: "Buscar", href: "/buscar", icone: "buscar" },
      ...dados.colecoes.map((c) => ({
        rotulo: c.nome,
        href: `/feeds/colecao/${c.id}`,
        icone: "lista" as const,
        detalhe: "Coleção",
      })),
      ...dados.colecoes.flatMap((c) =>
        c.fontes.map((f) => ({
          rotulo: f.nome,
          href: `/feeds/fonte/${f.id}`,
          favicon: faviconDe(f.host),
          detalhe: c.nome,
        })),
      ),
    ],
    [dados],
  );

  const filtrados = destinos.filter((d) =>
    d.rotulo.toLowerCase().includes(termo.trim().toLowerCase()),
  );

  useEffect(() => input.current?.focus(), []);

  function ir(destino: Destino | undefined) {
    if (!destino) return;
    router.push(destino.href);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center bg-overlay pt-[12vh]" onClick={onFechar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-menu-in w-full max-w-[520px] overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Icon nome="buscar" className="text-text-muted" />
          <input
            ref={input}
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setIndice(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndice((i) => Math.min(i + 1, filtrados.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndice((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                ir(filtrados[indice]);
              } else if (e.key === "Escape") {
                onFechar();
              }
            }}
            placeholder="Ir para um feed, coleção ou página..."
            className="h-12 flex-grow bg-transparent text-[15px] text-foreground outline-none placeholder:text-text-muted"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtrados.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-text-muted">Nada encontrado</li>
          )}
          {filtrados.map((d, i) => (
            <li key={d.href}>
              <button
                type="button"
                onMouseEnter={() => setIndice(i)}
                onClick={() => ir(d)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  i === indice ? "bg-surface-hover text-foreground" : "text-foreground"
                }`}
              >
                {d.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.favicon} alt="" className="h-4 w-4 rounded-sm" />
                ) : (
                  <Icon nome={d.icone ?? "lista"} tamanho={16} className="text-text-secondary" />
                )}
                <span className="flex-grow truncate">{d.rotulo}</span>
                {d.detalhe && <span className="text-xs text-text-muted">{d.detalhe}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
