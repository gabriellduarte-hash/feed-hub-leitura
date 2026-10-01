"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";

export function ThemeToggle() {
  const [tema, setTema] = useLocalStorage("tema", "dark");
  const escuro = tema !== "light";

  useEffect(() => {
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
  }, [escuro]);

  return (
    <button
      onClick={() => setTema(escuro ? "light" : "dark")}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
    >
      Tema escuro
      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          escuro ? "bg-accent" : "bg-surface-active"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            escuro ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
