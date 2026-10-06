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
      className="animate-toast-in fixed top-3 left-1/2 z-[60] w-max max-w-[calc(100vw-32px)] min-w-[min(320px,calc(100vw-32px))] -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-[0_12px_32px_-16px_rgba(0,0,0,0.4)]"
    >
      {toast.texto}
    </div>
  );
}
