"use client";

import { useCallback, useEffect, useMemo } from "react";
import { aplicarNoDocumento, CHAVE, lerPreferencias, type Preferencias } from "./preferencias";
import { useLocalStorage } from "./useLocalStorage";

export function usePreferencias() {
  const [texto, setTexto] = useLocalStorage(CHAVE, "");
  const preferencias = useMemo(() => lerPreferencias(texto || null), [texto]);

  const alterar = useCallback(
    (mudanca: Partial<Preferencias>) => {
      const nova = { ...preferencias, ...mudanca };
      setTexto(JSON.stringify(nova));
      aplicarNoDocumento(nova);
    },
    [preferencias, setTexto],
  );

  // Tema "sistema": acompanha quando o sistema troca de claro pra escuro
  useEffect(() => {
    if (preferencias.tema !== "sistema") return;
    const consulta = matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => aplicarNoDocumento(preferencias);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, [preferencias]);

  return [preferencias, alterar] as const;
}
