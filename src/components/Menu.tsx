"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type NomeIcone } from "./Icon";

type Posicao = { top?: number; bottom?: number; left?: number; right?: number };

export function Menu({
  gatilho,
  children,
  alinhar = "esquerda",
  largura = "w-56",
  classeGatilho = "",
  rotulo,
}: {
  gatilho: React.ReactNode;
  children: (fechar: () => void) => React.ReactNode;
  alinhar?: "esquerda" | "direita";
  largura?: string;
  classeGatilho?: string;
  rotulo?: string;
}) {
  // Renderizado num portal com posição fixa: assim o menu não é cortado
  // por containers com overflow (coleção recolhível, sidebar com rolagem)
  // nem herda o transform do painel de leitura.
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const aberto = posicao !== null;

  useEffect(() => {
    if (!aberto) return;
    const fechar = () => setPosicao(null);
    function aoClicarFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (!botao.current?.contains(alvo) && !caixa.current?.contains(alvo)) fechar();
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("resize", fechar);
    window.addEventListener("scroll", fechar, true);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("resize", fechar);
      window.removeEventListener("scroll", fechar, true);
    };
  }, [aberto]);

  function alternar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (aberto || !botao.current) {
      setPosicao(null);
      return;
    }
    const r = botao.current.getBoundingClientRect();
    const paraCima = r.bottom > window.innerHeight * 0.6;
    setPosicao({
      ...(paraCima ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      ...(alinhar === "direita" ? { right: window.innerWidth - r.right } : { left: r.left }),
    });
  }

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label={rotulo}
        aria-expanded={aberto}
        onClick={alternar}
        className={classeGatilho}
      >
        {gatilho}
      </button>
      {posicao &&
        createPortal(
          <div
            ref={caixa}
            onClick={(e) => e.stopPropagation()}
            style={posicao}
            className={`animate-menu-in fixed z-[70] max-h-[70vh] overflow-y-auto ${largura} rounded-lg border border-border bg-surface p-1 shadow-xl`}
          >
            {children(() => setPosicao(null))}
          </div>,
          document.body,
        )}
    </>
  );
}

export function ItemMenu({
  icone,
  children,
  onClick,
  perigo = false,
}: {
  icone?: NomeIcone;
  children: React.ReactNode;
  onClick: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
        perigo ? "text-red-500" : "text-foreground"
      }`}
    >
      {icone && <Icon nome={icone} tamanho={16} className={perigo ? "" : "text-text-secondary"} />}
      {children}
    </button>
  );
}

export function SeparadorMenu() {
  return <div className="my-1 h-px bg-border" />;
}
