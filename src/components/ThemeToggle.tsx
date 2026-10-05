"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon } from "./Icon";

export function ThemeToggle({ className = "", mostrarRotulo = false }: { className?: string; mostrarRotulo?: boolean }) {
  const [tema, setTema] = useLocalStorage("tema", "dark");
  const escuro = tema !== "light";

  useEffect(() => {
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
  }, [escuro]);

  const rotulo = escuro ? "Tema claro" : "Tema escuro";
  return (
    <button
      type="button"
      onClick={() => setTema(escuro ? "light" : "dark")}
      aria-label={rotulo}
      data-dica={mostrarRotulo ? undefined : rotulo}
      className={className}
    >
      <span key={tema} className="inline-flex flex-shrink-0 animate-[girar-entrada_350ms_ease-out]">
        <Icon nome={escuro ? "lua" : "sol"} tamanho={22} />
      </span>
      {mostrarRotulo && <span className="truncate">{rotulo}</span>}
    </button>
  );
}
