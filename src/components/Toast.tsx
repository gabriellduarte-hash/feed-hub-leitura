"use client";

import { useEffect, useState } from "react";

const EVENTO = "feed:toast";

export function mostrarToast(mensagem: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: mensagem }));
}

export function Toaster() {
  const [toast, setToast] = useState<{ id: number; texto: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function aoReceber(e: Event) {
      clearTimeout(timer);
      setToast({ id: Date.now(), texto: (e as CustomEvent<string>).detail });
      timer = setTimeout(() => setToast(null), 2400);
    }
    window.addEventListener(EVENTO, aoReceber);
    return () => {
      window.removeEventListener(EVENTO, aoReceber);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="animate-toast-in fixed top-3 left-1/2 z-[60] min-w-[320px] -translate-x-1/2 rounded-xl border border-border bg-surface-active px-4 py-2.5 text-sm text-foreground shadow-2xl"
    >
      {toast.texto}
    </div>
  );
}
