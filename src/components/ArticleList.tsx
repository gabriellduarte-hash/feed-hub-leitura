"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ArtigoLista, Secao } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
import { definirLido, definirSalvo } from "@/app/actions/artigos";
import { Icon } from "./Icon";
import { ArticlePanel } from "./ArticlePanel";

type Estado = { lido: boolean; salvo: boolean };

export function ArticleList({
  secoes,
  mostrarFim = false,
}: {
  secoes: Secao[];
  mostrarFim?: boolean;
}) {
  const artigos = useMemo(() => secoes.flatMap((s) => s.artigos), [secoes]);
  const [overrides, setOverrides] = useState<Record<string, Estado>>({});
  const [abertoId, setAbertoId] = useState<string | null>(null);
  // Continua exibindo o último artigo durante a animação de saída
  const [exibidoId, setExibidoId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const linhas = useRef(new Map<string, HTMLElement>());

  const estadoDe = useCallback(
    (a: ArtigoLista): Estado => overrides[a.id] ?? { lido: a.lido, salvo: a.salvo },
    [overrides],
  );

  const alterar = useCallback(
    (a: ArtigoLista, mudanca: Partial<Estado>) => {
      const novo = { ...estadoDe(a), ...mudanca };
      setOverrides((o) => ({ ...o, [a.id]: novo }));
      startTransition(async () => {
        if (mudanca.lido !== undefined) await definirLido(a.id, mudanca.lido);
        if (mudanca.salvo !== undefined) await definirSalvo(a.id, mudanca.salvo);
      });
    },
    [estadoDe],
  );

  const abrir = useCallback(
    (a: ArtigoLista) => {
      setAbertoId(a.id);
      setExibidoId(a.id);
      linhas.current.get(a.id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      // A Feedly marca como lido ao abrir
      if (!estadoDe(a).lido) alterar(a, { lido: true });
    },
    [alterar, estadoDe],
  );

  const indiceAberto = abertoId ? artigos.findIndex((a) => a.id === abertoId) : -1;
  const aberto = indiceAberto >= 0 ? artigos[indiceAberto] : null;
  const exibido = artigos.find((a) => a.id === exibidoId) ?? null;

  const irPara = useCallback(
    (delta: number) => {
      const proximo = artigos[indiceAberto + delta] ?? (indiceAberto < 0 ? artigos[0] : null);
      if (proximo) abrir(proximo);
    },
    [abrir, artigos, indiceAberto],
  );

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j") irPara(1);
      else if (e.key === "k") irPara(-1);
      else if (e.key === "Escape") setAbertoId(null);
      else if (aberto && e.key === "m") alterar(aberto, { lido: !estadoDe(aberto).lido });
      else if (aberto && e.key === "s") alterar(aberto, { salvo: !estadoDe(aberto).salvo });
      else if (aberto && e.key === "v") window.open(aberto.url, "_blank", "noopener");
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, alterar, estadoDe, irPara]);

  const revisados = artigos.filter((a) => estadoDe(a).lido).length;

  return (
    <>
      <div className="flex max-w-[680px] flex-col gap-10">
        {secoes.map((secao) => (
          <section key={secao.titulo} className="flex flex-col gap-1">
            <h2 className="mb-2 text-[13px] text-text-secondary">{secao.titulo}</h2>
            {secao.artigos.map((artigo, i) => (
              <LinhaArtigo
                key={artigo.id}
                artigo={artigo}
                estado={estadoDe(artigo)}
                ativo={artigo.id === abertoId}
                atraso={Math.min(i, 8) * 30}
                registrar={(el) => {
                  if (el) linhas.current.set(artigo.id, el);
                  else linhas.current.delete(artigo.id);
                }}
                onAbrir={() => abrir(artigo)}
                onAlterar={(m) => alterar(artigo, m)}
              />
            ))}
          </section>
        ))}
      </div>

      {mostrarFim && artigos.length > 0 && (
        <div className="mt-12 flex max-w-[680px] flex-col gap-8 pb-10">
          <div className="text-[13px] text-text-secondary">Fim do feed</div>
          <div className="text-center text-xs text-text-muted">
            {revisados} {revisados === 1 ? "artigo revisado" : "artigos revisados"}
          </div>
        </div>
      )}

      {exibido && (
        <ArticlePanel
          artigo={exibido}
          estado={estadoDe(exibido)}
          saindo={!aberto}
          temAnterior={indiceAberto > 0}
          temProximo={indiceAberto >= 0 && indiceAberto < artigos.length - 1}
          onFechar={() => setAbertoId(null)}
          onSaiu={() => setExibidoId(null)}
          onNavegar={irPara}
          onAlterar={(m) => alterar(exibido, m)}
        />
      )}
    </>
  );
}

function LinhaArtigo({
  artigo,
  estado,
  ativo,
  atraso,
  registrar,
  onAbrir,
  onAlterar,
}: {
  artigo: ArtigoLista;
  estado: Estado;
  ativo: boolean;
  atraso: number;
  registrar: (el: HTMLElement | null) => void;
  onAbrir: () => void;
  onAlterar: (m: Partial<Estado>) => void;
}) {
  const resumo = artigo.ai_summary ?? artigo.content;

  return (
    <article
      ref={registrar}
      onClick={onAbrir}
      style={{ animationDelay: `${atraso}ms` }}
      className={`animate-fade-up group relative -mx-3 flex cursor-pointer gap-5 rounded-lg px-3 py-4 transition-colors duration-150 hover:bg-surface-hover/60 ${
        ativo ? "bg-surface-hover/60" : ""
      }`}
    >
      <div className="relative h-[84px] w-[140px] flex-shrink-0 overflow-hidden rounded-md bg-surface-active">
        {artigo.image_url ? (
          // <img> simples: as URLs vêm de feeds arbitrários, e liberar
          // qualquer domínio no next/image vira um proxy de imagem aberto
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artigo.image_url}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] ${
              estado.lido ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faviconDe(artigo.fonteHost)} alt="" className="h-8 w-8 rounded opacity-70" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 max-w-[480px] flex-grow flex-col gap-1 pr-20">
        <h3
          className={`text-[17px] leading-snug font-semibold transition-colors ${
            estado.lido ? "text-text-muted" : "text-foreground"
          }`}
        >
          {artigo.title}
        </h3>
        <Meta artigo={artigo} salvo={estado.salvo} />
        {resumo && (
          <p className="line-clamp-3 text-[13px] leading-[1.45] text-text-muted">{resumo}</p>
        )}
      </div>

      <div className="absolute top-4 right-3 flex translate-x-1 items-center gap-0.5 opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 focus-within:opacity-100">
        <BotaoAcao
          rotulo={estado.salvo ? "Remover de Ler mais tarde" : "Ler mais tarde"}
          ativo={estado.salvo}
          onClick={() => onAlterar({ salvo: !estado.salvo })}
          icone="marcador"
        />
        <BotaoAcao
          rotulo={estado.lido ? "Marcar como não lido" : "Marcar como lido"}
          ativo={estado.lido}
          onClick={() => onAlterar({ lido: !estado.lido })}
          icone="check"
        />
      </div>
    </article>
  );
}

function Meta({ artigo, salvo }: { artigo: ArtigoLista; salvo: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-text-muted">
      {salvo ? (
        <span className="flex items-center gap-1 text-accent">
          <Icon nome="marcador" tamanho={13} />
          Ler mais tarde
        </span>
      ) : (
        artigo.category && (
          <span className="flex items-center gap-1 text-accent">
            <Icon nome="tendencia" tamanho={14} />
            {artigo.category}
          </span>
        )
      )}
      {(salvo || artigo.category) && <span aria-hidden>•</span>}
      <span>
        {artigo.fonteNome} / {artigo.tempo}
      </span>
    </div>
  );
}

function BotaoAcao({
  rotulo,
  ativo,
  onClick,
  icone,
}: {
  rotulo: string;
  ativo: boolean;
  onClick: () => void;
  icone: "marcador" | "check";
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition duration-150 hover:bg-surface-active active:scale-90 ${
        ativo ? "text-accent" : "text-text-secondary hover:text-foreground"
      }`}
    >
      <Icon nome={icone} tamanho={17} preenchido={ativo && icone === "marcador"} />
    </button>
  );
}
