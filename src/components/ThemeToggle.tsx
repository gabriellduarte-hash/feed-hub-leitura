"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("tema");
    if (salvo === "dark") {
      setEscuro(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function alternar() {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.setAttribute("data-theme", novo ? "dark" : "light");
    localStorage.setItem("tema", novo ? "dark" : "light");
  }

  return (
    <button
      onClick={alternar}
      aria-label="Alternar tema claro/escuro"
      className="flex h-6 w-10 items-center rounded-full p-[3px] transition-colors"
      style={{ background: escuro ? "var(--accent)" : "var(--surface-hover)" }}
    >
      <div
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-surface transition-transform"
        style={{ transform: escuro ? "translateX(16px)" : "translateX(0)" }}
      >
        {escuro ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        ) : (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.4"
          >
            <circle cx="12" cy="12" r="4.5" />
            <line x1="12" y1="2" x2="12" y2="4.5" />
            <line x1="12" y1="19.5" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4.5" y2="12" />
            <line x1="19.5" y1="12" x2="22" y2="12" />
          </svg>
        )}
      </div>
    </button>
  );
}
