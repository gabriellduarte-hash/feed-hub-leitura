"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { codigoPix, contaPixConfigurada } from "@/lib/pix";
import { Icon } from "./Icon";

/* "Apoiar o projeto" por PIX: escolhe o valor, aparece o QR Code e o
 * código "copia e cola". Nas Configurações, na página de entrada e em
 * /apoiar (o link do e-mail do resumo). A chave fica nas variáveis da
 * Vercel (NEXT_PUBLIC_PIX_*); sem ela, só aparece o texto. */

const VALORES = [5, 10, 20];

export function ApoiarProjeto({ titulo = "Gostou do Feed de Notícias?" }: { titulo?: string }) {
  const conta = contaPixConfigurada();
  const [valor, setValor] = useState<number | "outro">(10);
  const [outro, setOutro] = useState("");
  const [aberto, setAberto] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const valorFinal = valor === "outro" ? Number(outro.replace(",", ".")) || undefined : valor;
  const codigo = conta && aberto ? codigoPix(conta, valorFinal) : null;

  useEffect(() => {
    if (!codigo) return;
    let ativo = true;
    QRCode.toDataURL(codigo, { margin: 1, width: 360, errorCorrectionLevel: "M", color: { dark: "#121212", light: "#ffffff" } })
      .then((url) => ativo && setQr(url))
      .catch(() => ativo && setQr(null));
    return () => {
      ativo = false;
    };
  }, [codigo]);

  async function copiar() {
    if (!codigo) return;
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[28px] leading-none" aria-hidden>
          ☕
        </span>
        <h3 className="text-[18px] font-extrabold tracking-tight text-foreground">{titulo}</h3>
        <p className="max-w-[420px] text-[13px] leading-relaxed text-text-secondary">
          Este projeto é independente e não depende de publicidade para funcionar. Se ele foi útil para você,
          ajude a mantê-lo.
        </p>
      </div>

      {!conta ? (
        <p className="text-[13px] text-text-muted">Em breve você vai poder apoiar por PIX.</p>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Valor do apoio">
            {VALORES.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={valor === v}
                onClick={() => setValor(v)}
                className={`h-10 rounded-md border px-4 text-[14px] font-semibold transition-colors ${
                  valor === v
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                R$ {v}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={valor === "outro"}
              onClick={() => setValor("outro")}
              className={`h-10 rounded-md border px-4 text-[14px] font-semibold transition-colors ${
                valor === "outro"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              Outro valor
            </button>
          </div>

          {valor === "outro" && (
            <label className="animate-fade-up flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-[14px]">
              <span className="text-text-muted">R$</span>
              <input
                inputMode="decimal"
                value={outro}
                onChange={(e) => setOutro(e.target.value.replace(/[^\d,.]/g, ""))}
                placeholder="0,00"
                aria-label="Outro valor, em reais"
                className="w-24 bg-transparent text-foreground outline-none"
              />
            </label>
          )}

          {!aberto ? (
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-[14px] font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              <Icon nome="adicionar" tamanho={16} espessura={2.2} />
              PIX
            </button>
          ) : (
            <div className="animate-fade-up flex w-full max-w-[320px] flex-col items-center gap-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR Code do PIX" width={180} height={180} className="rounded-md border border-border bg-white p-1" />
              ) : (
                <div className="h-[180px] w-[180px] animate-pulse rounded-md bg-surface-active" />
              )}
              <div className="text-[12px] text-text-muted">
                Chave PIX: <span className="font-semibold break-all text-foreground">{conta.chave}</span>
              </div>
              <button
                type="button"
                onClick={copiar}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Icon nome={copiado ? "check" : "link"} tamanho={15} />
                {copiado ? "Código copiado" : "Copiar código PIX"}
              </button>
              <p className="text-[11px] text-text-muted">
                No app do banco, escolha PIX › Pagar com QR Code ou PIX Copia e Cola.
              </p>
            </div>
          )}
        </>
      )}

      <p className="text-[13px] font-semibold text-foreground">Obrigado por apoiar o projeto ❤️</p>
    </div>
  );
}
