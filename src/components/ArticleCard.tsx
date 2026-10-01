"use client";

import { useEffect, useState } from "react";
import { salvarArtigo, removerSalvo } from "@/app/actions/saved-articles";

export type Artigo = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  ai_summary: string | null;
  category: string | null;
  published_at: string | null;
  image_url: string | null;
};

function formatarData(iso: string | null) {
  if (!iso) return "data não informada";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ArticleCard({
  artigo,
  salvo,
  path,
}: {
  artigo: Artigo;
  salvo: boolean;
  path: string;
}) {
  const resumoCurto = artigo.ai_summary ?? artigo.content;
  const [aberto, setAberto] = useState(false);
  const [visivel, setVisivel] = useState(false);

  function abrirPainel() {
    setAberto(true);
    // um tick depois de montar com translate-x-full, pra garantir que o
    // navegador aplique a transição em vez de já nascer no estado final
    requestAnimationFrame(() => requestAnimationFrame(() => setVisivel(true)));
  }

  function fecharPainel() {
    setVisivel(false);
    setTimeout(() => setAberto(false), 250);
  }

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fecharPainel();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      <div
        onClick={abrirPainel}
        className="group flex cursor-pointer gap-4 rounded-xl border border-border bg-surface p-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-md"
      >
        {artigo.image_url ? (
          // <img> simples de propósito: a URL vem de fontes RSS
          // arbitrárias, e o next/image com remotePatterns liberado pra
          // qualquer domínio vira um "proxy de imagem aberto" — a própria
          // doc do Next desaconselha esse padrão.
          <div className="w-[168px] flex-shrink-0 overflow-hidden rounded-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artigo.image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex w-[168px] flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 15l-5-5-9 9" />
            </svg>
          </div>
        )}

        <div className="flex min-w-0 flex-grow flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-base font-bold text-foreground transition-colors group-hover:text-accent">
              {artigo.title}
            </div>
            <form
              action={salvo ? removerSalvo : salvarArtigo}
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="article_id" value={artigo.id} />
              <input type="hidden" name="path" value={path} />
              <button
                type="submit"
                aria-label={salvo ? "Remover de ler mais tarde" : "Salvar pra ler mais tarde"}
                className="text-text-muted transition-transform duration-150 hover:scale-[1.15] hover:text-accent active:scale-95"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill={salvo ? "var(--accent)" : "none"}
                  stroke={salvo ? "var(--accent)" : "currentColor"}
                  strokeWidth="1.8"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </form>
          </div>
          <div className="mono text-[11px] text-text-muted">
            {artigo.author ?? "autor não informado"} · {formatarData(artigo.published_at)}
          </div>
          {resumoCurto && (
            <div className="line-clamp-2 text-[13px] text-text-secondary">{resumoCurto}</div>
          )}
          <a
            href={artigo.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 inline-flex w-fit items-center gap-1 text-xs font-bold text-accent"
          >
            Ler artigo completo
            <span className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>
      </div>

      {aberto && (
        <div
          onClick={fecharPainel}
          className={`fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-[250ms] ${
            visivel ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface shadow-2xl transition-transform duration-[250ms] ease-out ${
              visivel ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <button
                onClick={fecharPainel}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {artigo.category && (
                <span className="mono rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold tracking-wider text-accent uppercase">
                  {artigo.category}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 px-6 py-6">
              {artigo.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artigo.image_url}
                  alt=""
                  className="w-full rounded-xl object-cover"
                />
              )}

              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold text-foreground">{artigo.title}</h1>
                <div className="mono text-xs text-text-muted">
                  {artigo.author ?? "autor não informado"} · {formatarData(artigo.published_at)}
                </div>
              </div>

              {artigo.ai_summary && (
                <div className="flex flex-col gap-1.5">
                  <div className="mono text-[11px] font-bold tracking-wider text-text-muted uppercase">
                    Resumo
                  </div>
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {artigo.ai_summary}
                  </p>
                </div>
              )}

              {artigo.content && artigo.content !== artigo.ai_summary && (
                <div className="flex flex-col gap-1.5 border-t border-border pt-5">
                  <div className="mono text-[11px] font-bold tracking-wider text-text-muted uppercase">
                    Notícia completa
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                    {artigo.content}
                  </p>
                </div>
              )}

              <a
                href={artigo.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85"
              >
                Ler notícia original
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
