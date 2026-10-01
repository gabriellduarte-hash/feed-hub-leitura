"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENTO = "feed:local-storage";

function assinar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

/** Valor em texto guardado no localStorage. No servidor (e na hidratação)
 * vale o padrão, e o valor salvo entra logo em seguida — sem diferença
 * de HTML entre servidor e cliente. */
export function useLocalStorage(chave: string, padrao: string) {
  const valor = useSyncExternalStore(
    assinar,
    () => {
      try {
        return localStorage.getItem(chave) ?? padrao;
      } catch {
        return padrao;
      }
    },
    () => padrao,
  );

  const definir = useCallback(
    (novo: string) => {
      try {
        localStorage.setItem(chave, novo);
      } catch {
        // modo privado/armazenamento bloqueado: segue só na memória do evento
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [chave],
  );

  return [valor, definir] as const;
}
