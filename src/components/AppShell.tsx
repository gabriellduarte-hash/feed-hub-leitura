"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { faviconDe } from "@/lib/fonte";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon, type NomeIcone } from "./Icon";
import { Sidebar, type DadosSidebar } from "./Sidebar";
import { Toaster } from "./Toast";

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
    <div className="flex h-screen bg-background">
      <Sidebar
        dados={dados}
        recolhido={recolhido}
        onAlternar={alternar}
        onIrPara={() => setIrParaAberto(true)}
      />

      <main className="relative min-w-0 flex-grow overflow-y-auto">{children}</main>

      {irParaAberto && <IrPara dados={dados} onFechar={() => setIrParaAberto(false)} />}
      <Toaster />
    </div>
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
        className="animate-menu-in w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
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
