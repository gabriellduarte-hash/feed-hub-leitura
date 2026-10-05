"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { agruparPorDia, type ArtigoLista, type FiltroPagina, type Secao } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
import { definirLido, definirSalvo } from "@/app/actions/artigos";
import { carregarMaisArtigos } from "@/app/actions/paginacao";
import { Icon } from "./Icon";
import { ArticlePanel } from "./ArticlePanel";

type Estado = { lido: boolean; salvo: boolean };

/** Modo feed: primeira página vinda do servidor + rolagem infinita, agrupado por dia. */
export type Feed = { artigos: ArtigoLista[]; filtro: FiltroPagina; temMais: boolean };

export function ArticleList({
  secoes: secoesFixas,
  feed,
  mostrarFim = false,
}: {
  secoes?: Secao[];
  feed?: Feed;
  mostrarFim?: boolean;
}) {
  const [extras, setExtras] = useState<ArtigoLista[]>([]);
  const [temMais, setTemMais] = useState(feed?.temMais ?? false);
  const [carregando, setCarregando] = useState(false);
  const [erroAoCarregar, setErroAoCarregar] = useState(false);
  const emAndamento = useRef(false);
  const sentinela = useRef<HTMLDivElement>(null);

  const artigos = useMemo(() => {
    if (!feed) return (secoesFixas ?? []).flatMap((s) => s.artigos);
    // Sem repetir: se chegaram artigos novos entre uma página e outra,
    // o mesmo item pode vir de novo na página seguinte
    const vistos = new Set<string>();
    return [...feed.artigos, ...extras].filter((a) => !vistos.has(a.id) && vistos.add(a.id));
  }, [feed, extras, secoesFixas]);
  const secoes = useMemo(
    () => (feed ? agruparPorDia(artigos) : (secoesFixas ?? [])),
    [feed, artigos, secoesFixas],
  );
  const proximoOffset = (feed?.artigos.length ?? 0) + extras.length;

  const carregarMais = useCallback(async () => {
    if (!feed || emAndamento.current) return;
    emAndamento.current = true;
    setCarregando(true);
    setErroAoCarregar(false);
    try {
      const pagina = await carregarMaisArtigos(feed.filtro, proximoOffset);
      setExtras((atual) => [...atual, ...pagina.artigos]);
      setTemMais(pagina.temMais);
    } catch {
      setErroAoCarregar(true);
    } finally {
      emAndamento.current = false;
      setCarregando(false);
    }
  }, [feed, proximoOffset]);

  // Quando o fim da lista chega a ~600px da tela, pede a próxima página.
  // Recria o observer a cada página: se o fim continuar visível (tela
  // alta, página curta), ele dispara de novo e continua carregando.
  useEffect(() => {
    const el = sentinela.current;
    if (!el || !feed || !temMais || erroAoCarregar) return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) carregarMais();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [carregarMais, feed, temMais, erroAoCarregar]);

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
      // j no último item já carregado: busca a próxima página
      if (delta > 0 && indiceAberto >= artigos.length - 3 && temMais) carregarMais();
    },
    [abrir, artigos, indiceAberto, temMais, carregarMais],
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
  const chegouAoFim = feed ? !temMais : mostrarFim;

  return (
    <>
      <div className="flex max-w-[720px] flex-col gap-8">
        {secoes.map((secao) => (
          <section key={secao.titulo} className="flex flex-col gap-1">
            <h2 className="sticky top-0 z-10 -mx-3 mb-1 flex items-center gap-3 bg-background/85 px-3 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase backdrop-blur">
              {secao.titulo}
              <span className="h-px flex-grow bg-border" />
              <span className="font-normal tracking-normal normal-case">{secao.artigos.length}</span>
            </h2>
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

      {feed && temMais && (
        <div ref={sentinela} className="flex max-w-[720px] flex-col gap-1 pt-2">
          {erroAoCarregar ? (
            <button
              type="button"
              onClick={carregarMais}
              className="mx-auto my-6 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
            >
              Não deu pra carregar mais. Tentar de novo
            </button>
          ) : (
            carregando && [0, 1, 2].map((i) => <LinhaEsqueleto key={i} />)
          )}
        </div>
      )}

      {chegouAoFim && artigos.length > 0 && (
        <div className="mt-12 flex max-w-[720px] flex-col gap-8 pb-10">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            Fim do feed
            <span className="h-px flex-grow bg-border" />
          </div>
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
          temProximo={indiceAberto >= 0 && (indiceAberto < artigos.length - 1 || temMais)}
          onFechar={() => setAbertoId(null)}
          onSaiu={() => setExibidoId(null)}
          onNavegar={irPara}
          onAlterar={(m) => alterar(exibido, m)}
        />
      )}
    </>
  );
}

function LinhaEsqueleto() {
  return (
    <div className="flex animate-pulse gap-5 py-3.5">
      <div className="aspect-[16/10] w-[152px] flex-shrink-0 bg-surface-active" />
      <div className="flex flex-grow flex-col gap-2.5 pt-1">
        <div className="h-3.5 w-4/5 rounded bg-surface-active" />
        <div className="h-3 w-2/5 rounded bg-surface-active" />
        <div className="h-3 w-full rounded bg-surface-hover" />
      </div>
    </div>
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
      className={`animate-fade-up group relative -mx-3 flex cursor-pointer gap-5 rounded-xl px-3 py-3.5 transition-colors duration-150 hover:bg-surface-hover/70 ${
        ativo ? "bg-surface-hover/70" : ""
      }`}
    >
      <div className="relative aspect-[16/10] w-[152px] flex-shrink-0 self-start overflow-hidden bg-surface-active">
        {artigo.image_url ? (
          // <img> simples: as URLs vêm de feeds arbitrários, e liberar
          // qualquer domínio no next/image vira um proxy de imagem aberto
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artigo.image_url}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.06] ${
              estado.lido ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faviconDe(artigo.fonteHost)} alt="" className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-grow flex-col gap-1.5 pt-0.5 pr-20">
        <h3
          className={`text-[15px] leading-[1.45] font-semibold tracking-tight transition-colors ${
            estado.lido ? "text-text-muted" : "text-foreground"
          }`}
        >
          {artigo.title}
        </h3>
        <Meta artigo={artigo} salvo={estado.salvo} />
        {resumo && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-text-muted">{resumo}</p>
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
    <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-text-muted">
      {artigo.category && (
        <span className="rounded-md bg-accent-soft px-1.5 py-px text-accent">
          #{artigo.category.toLowerCase()}
        </span>
      )}
      <span className="text-text-secondary">{artigo.fonteNome}</span>
      <span aria-hidden>·</span>
      <span>{artigo.tempo}</span>
      {salvo && (
        <span className="flex items-center gap-1 text-accent" title="Em Ler mais tarde">
          <Icon nome="marcador" tamanho={12} preenchido />
        </span>
      )}
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
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition duration-150 hover:bg-surface-active active:scale-90 ${
        ativo ? "text-accent" : "text-text-secondary hover:text-foreground"
      }`}
    >
      <Icon nome={icone} tamanho={17} preenchido={ativo && icone === "marcador"} />
    </button>
  );
}
