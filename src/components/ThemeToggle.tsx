"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon } from "./Icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
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
      data-dica={rotulo}
      className={className}
    >
      <span key={tema} className="inline-flex animate-[girar-entrada_350ms_ease-out]">
        <Icon nome={escuro ? "lua" : "sol"} tamanho={24} />
      </span>
    </button>
  );
}
