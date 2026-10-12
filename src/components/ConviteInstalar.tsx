"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LogoReduzida } from "./Logo";

/* Convite pra instalar o Daily Paper como app, a partir da segunda visita.
 * - Chrome e Edge (Android e computador): o botão "Instalar" abre a
 *   confirmação do próprio navegador. Nenhum site instala sem ela.
 * - iPhone e iPad: não existe botão pra isso; o convite mostra o caminho
 *   (Compartilhar › Adicionar à Tela de Início).
 * - Firefox no computador não instala sites: o convite não aparece.
 * Dispensado, só volta depois de 30 dias. Já instalado, nunca aparece.
 *
 * O evento do navegador (beforeinstallprompt) costuma chegar antes da
 * página terminar de carregar, então o layout guarda ele num script
 * inline (lib/instalar.ts) e avisa com "dailypaper:instalavel". */

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type JanelaComEvento = Window & { __eventoInstalar?: EventoInstalar };

const CHAVE_VISITAS = "instalar-visitas";
const CHAVE_DISPENSADO = "instalar-dispensado-em";
const VISITAS_MINIMAS = 2;
const DIAS_SEM_INSISTIR = 30;
const ESPERA_MS = 3000; // não aparece no mesmo instante em que a página abre

function ler(chave: string) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // navegador sem armazenamento: o convite só não lembra
  }
}

/** Conta uma visita por sessão do navegador e diz se já pode convidar. */
function contarVisitaEPodeConvidar() {
  let visitas = Number(ler(CHAVE_VISITAS) ?? 0);
  try {
    if (!sessionStorage.getItem("instalar-sessao")) {
      sessionStorage.setItem("instalar-sessao", "1");
      visitas += 1;
      gravar(CHAVE_VISITAS, String(visitas));
    }
  } catch {
    // sem sessionStorage: conta pelo que já estava gravado
  }
  const dispensadoEm = Number(ler(CHAVE_DISPENSADO) ?? 0);
  return visitas >= VISITAS_MINIMAS && Date.now() - dispensadoEm > DIAS_SEM_INSISTIR * 86_400_000;
}

function jaInstalado() {
  return matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function ConviteInstalar() {
  const [modo, setModo] = useState<"botao" | "ios" | null>(null);

  useEffect(() => {
    if (jaInstalado() || !contarVisitaEPodeConvidar()) return;
    const janela = window as JanelaComEvento;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mostrar = (qual: "botao" | "ios") => {
      clearTimeout(timer);
      timer = setTimeout(() => setModo(qual), ESPERA_MS);
    };

    if (janela.__eventoInstalar) mostrar("botao");
    else if (ehIOS()) mostrar("ios");
    const aoFicarInstalavel = () => mostrar("botao");
    const aoInstalar = () => {
      setModo(null);
      gravar(CHAVE_DISPENSADO, String(Date.now()));
    };
    window.addEventListener("dailypaper:instalavel", aoFicarInstalavel);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("dailypaper:instalavel", aoFicarInstalavel);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (!modo) return null;

  function dispensar() {
    gravar(CHAVE_DISPENSADO, String(Date.now()));
    setModo(null);
  }

  async function instalar() {
    const evento = (window as JanelaComEvento).__eventoInstalar;
    if (!evento) return dispensar();
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    (window as JanelaComEvento).__eventoInstalar = undefined; // o navegador só deixa usar uma vez
    if (outcome === "dismissed") gravar(CHAVE_DISPENSADO, String(Date.now()));
    setModo(null);
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar o Daily Paper"
      className="animate-fade-up fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-[400px] rounded-xl border border-border bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] md:inset-x-auto md:right-6 md:bottom-6"
    >
      <div className="flex gap-3">
        <LogoReduzida tamanho={44} />
        <div className="min-w-0 flex-grow">
          <p className="text-[14px] font-bold text-foreground">Instale o Daily Paper</p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            {modo === "ios" ? (
              <>
                Toque em <b className="text-foreground">Compartilhar</b>{" "}
                <Icon nome="compartilhar" tamanho={13} className="inline align-[-2px]" /> e depois em{" "}
                <b className="text-foreground">Adicionar à Tela de Início</b>.
              </>
            ) : (
              "Abra direto da tela inicial ou da área de trabalho, como um app, sem passar pelo navegador."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dispensar}
          aria-label="Fechar"
          className="-mt-1 -mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-hover hover:text-foreground"
        >
          <Icon nome="fechar" tamanho={16} />
        </button>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={dispensar}
          className="h-9 rounded-md px-3 text-[13px] font-semibold text-text-secondary transition hover:text-foreground"
        >
          {modo === "ios" ? "Entendi" : "Agora não"}
        </button>
        {modo === "botao" && (
          <button
            type="button"
            onClick={instalar}
            className="h-9 rounded-md bg-foreground px-4 text-[13px] font-bold text-background transition hover:bg-accent active:scale-[0.98]"
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
