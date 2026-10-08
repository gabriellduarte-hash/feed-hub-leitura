"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/* Barra fina no topo: aparece no instante do clique num link (ou na busca)
 * e completa quando a página nova chega. Assim o clique sempre dá retorno,
 * mesmo quando o servidor demora alguns segundos. */

type Fase = "parada" | "indo" | "chegou";

function ehMesmaPagina(url: URL) {
  return url.pathname === location.pathname && url.search === location.search;
}

export function BarraDeProgresso() {
  const pathname = usePathname();
  const busca = useSearchParams();
  const endereco = `${pathname}?${busca.toString()}`;
  const [fase, setFase] = useState<Fase>("parada");

  // A URL mudou: a navegação terminou (ajuste durante a renderização,
  // sem efeito, como a documentação do React recomenda)
  const [enderecoAnterior, setEnderecoAnterior] = useState(endereco);
  if (endereco !== enderecoAnterior) {
    setEnderecoAnterior(endereco);
    if (fase === "indo") setFase("chegou");
  }

  useEffect(() => {
    // Captura: o <Link> do Next cancela o clique padrão logo depois
    function aoClicar(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || ehMesmaPagina(url)) return;
      setFase("indo");
    }
    function aoEnviar(e: SubmitEvent) {
      const form = e.target as HTMLFormElement;
      if (form.method.toLowerCase() !== "get") return;
      const url = new URL(form.action, location.href);
      if (url.origin === location.origin) setFase("indo");
    }
    document.addEventListener("click", aoClicar, true);
    document.addEventListener("submit", aoEnviar, true);
    return () => {
      document.removeEventListener("click", aoClicar, true);
      document.removeEventListener("submit", aoEnviar, true);
    };
  }, []);

  useEffect(() => {
    if (fase === "parada") return;
    // "chegou": completa e some. "indo": se nada mudar em 12s (o clique
    // não navegou), some do mesmo jeito.
    const t = setTimeout(() => setFase(fase === "chegou" ? "parada" : "chegou"), fase === "chegou" ? 450 : 12_000);
    return () => clearTimeout(t);
  }, [fase]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className="h-full origin-left bg-accent shadow-[0_0_8px_var(--accent)]"
        style={
          fase === "indo"
            ? { transform: "scaleX(0.85)", opacity: 1, transition: "transform 8s cubic-bezier(0.08, 0.7, 0.2, 1), opacity 150ms" }
            : fase === "chegou"
              ? { transform: "scaleX(1)", opacity: 0, transition: "transform 200ms ease-out, opacity 250ms ease 180ms" }
              : { transform: "scaleX(0)", opacity: 0 }
        }
      />
    </div>
  );
}
