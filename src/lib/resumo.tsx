import { Fragment, type ReactNode } from "react";

/* O resumo da IA vem em Markdown simples (resumo/resumir.py no coletor):
 * parágrafos separados por linha em branco, **negrito**, *itálico* e
 * "> citação — Autor". Aqui ele vira elementos React — nunca HTML cru,
 * então nada que a IA escreva vira código na página. Resumos antigos
 * (texto corrido) viram um parágrafo só. */

type Bloco = { tipo: "p"; texto: string } | { tipo: "citacao"; texto: string; autor: string | null };

function blocos(resumo: string): Bloco[] {
  return resumo
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Bloco => {
      if (b.startsWith(">")) {
        const texto = b
          .split("\n")
          .map((l) => l.replace(/^>\s?/, "").trim())
          .join(" ");
        const m = texto.match(/^(.*?)\s+[—–-]\s+([^—–-]{2,60})$/);
        return m ? { tipo: "citacao", texto: m[1], autor: m[2] } : { tipo: "citacao", texto, autor: null };
      }
      return { tipo: "p", texto: b.replace(/\s*\n\s*/g, " ") };
    });
}

/** **negrito** e *itálico* dentro de um parágrafo. */
function inline(texto: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|(?<![\w*])\*(?!\s)[^*]+?(?<!\s)\*(?![\w*]))/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Resumo formatado, com a fonte e o tamanho de leitura das Configurações. */
export function ResumoFormatado({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-5 font-[family-name:var(--fonte-leitura)] text-[length:var(--tamanho-leitura)] leading-[1.85] text-foreground/80 ${className}`}
    >
      {blocos(texto).map((b, i) =>
        b.tipo === "citacao" ? (
          <blockquote key={i} className="border-l-2 border-accent py-1 pl-5">
            <p className="text-[1.08em] leading-[1.7] font-medium text-foreground italic">{inline(b.texto)}</p>
            {b.autor && (
              <footer className="mt-2 text-[0.8em] font-semibold tracking-wide text-text-muted not-italic">
                — {b.autor}
              </footer>
            )}
          </blockquote>
        ) : (
          <p key={i}>{inline(b.texto)}</p>
        ),
      )}
    </div>
  );
}

/** Texto sem as marcações, pra prévias de uma ou duas linhas (lista de artigos). */
export function textoPuro(resumo: string | null) {
  if (!resumo) return "";
  return resumo
    .replace(/^>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![\w*])\*(?!\s)([^*]+?)(?<!\s)\*(?![\w*])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
