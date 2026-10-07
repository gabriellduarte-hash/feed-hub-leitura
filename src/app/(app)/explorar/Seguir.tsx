"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { adicionarFonte, type ResultadoAdicionar } from "@/app/actions/adicionar-fonte";
import { buscarFontesNaWeb, type FonteNaWeb } from "@/app/actions/buscar-fontes";
import { faviconDe } from "@/lib/fonte";
import { Icon } from "@/components/Icon";
import { ItemMenu, Menu, SeparadorMenu } from "@/components/Menu";
import { mostrarToast } from "@/components/Toast";

type Colecao = { id: string; nome: string };

export function resumoDaAdicao(r: ResultadoAdicionar) {
  const total = (r.importadas ?? 0) + (r.coletadas ?? 0);
  if (total === 1) return "1 notícia já está no seu feed.";
  return total > 0 ? `${total} notícias já estão no seu feed.` : "As primeiras notícias chegam em breve.";
}

/** Seguir uma fonte do catálogo (catalogoId) ou achada na web (url).
 * Sem categoria (as da web), "Nova coleção" pergunta o nome. */
export function BotaoSeguir({
  catalogoId,
  url,
  nome,
  categoria,
  colecoes,
  colecaoPreferida,
}: {
  catalogoId?: string;
  url?: string;
  nome: string;
  categoria?: string;
  colecoes: Colecao[];
  colecaoPreferida?: Colecao;
}) {
  const [pendente, startTransition] = useTransition();
  const [seguindo, setSeguindo] = useState(false);

  function seguir(colecao: Colecao | null) {
    const novaColecao = colecao ? undefined : (categoria ?? window.prompt("Nome da nova coleção")?.trim());
    if (!colecao && !novaColecao) return;
    setSeguindo(true);
    startTransition(async () => {
      const r = await adicionarFonte({ catalogoId, url, topicId: colecao?.id, novaColecao });
      if (r.erro) {
        setSeguindo(false);
        mostrarToast(r.erro);
      } else {
        mostrarToast(`Seguindo ${nome} em ${colecao?.nome ?? novaColecao}. ${resumoDaAdicao(r)}`);
      }
    });
  }

  const classe =
    "flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-semibold text-background transition-colors hover:bg-accent active:scale-95 disabled:opacity-60 sm:h-8 sm:w-auto sm:rounded-md sm:px-3.5";
  const rotulo = (
    <>
      <Icon nome="adicionar" tamanho={16} espessura={2.2} className="sm:hidden" />
      <span className="hidden sm:inline">Seguir</span>
    </>
  );

  if (seguindo) {
    return (
      <span
        title={pendente ? "Carregando notícias…" : "Seguindo"}
        className="animate-fade-up flex h-9 w-9 items-center justify-center gap-1.5 rounded-full border border-border text-sm text-text-secondary sm:h-8 sm:w-auto sm:rounded-md sm:px-3"
      >
        <Icon nome="check" tamanho={15} className={pendente ? "animate-pulse" : ""} />
        <span className="hidden sm:inline">{pendente ? "Carregando notícias…" : "Seguindo"}</span>
      </span>
    );
  }

  if (colecaoPreferida) {
    return (
      <button type="button" onClick={() => seguir(colecaoPreferida)} aria-label={`Seguir ${nome}`} className={classe}>
        {rotulo}
      </button>
    );
  }

  const temColecaoDaCategoria = !!categoria && colecoes.some((c) => c.nome === categoria);

  return (
    <Menu alinhar="direita" gatilho={rotulo} classeGatilho={classe} rotulo={`Seguir ${nome}`}>
      {() => (
        <>
          <div className="px-3 pt-1.5 pb-1 text-[11px] text-text-muted">Adicionar à coleção</div>
          {colecoes.map((c) => (
            <ItemMenu key={c.id} icone="lista" onClick={() => seguir(c)}>
              {c.nome}
            </ItemMenu>
          ))}
          {!temColecaoDaCategoria && (
            <>
              {colecoes.length > 0 && <SeparadorMenu />}
              <ItemMenu icone="adicionar" onClick={() => seguir(null)}>
                {categoria ? <>Nova coleção &quot;{categoria}&quot;</> : "Nova coleção…"}
              </ItemMenu>
            </>
          )}
        </>
      )}
    </Menu>
  );
}

const campo =
  "h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted";

/** Formulário "Por link": cola qualquer link (site ou RSS) e o hub descobre sozinho. */
export function SeguirPorUrlForm({ colecoes, colecaoPreferida }: { colecoes: Colecao[]; colecaoPreferida?: string }) {
  const [pendente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAdicionar | null>(null);
  const [colecao, setColecao] = useState(colecaoPreferida ?? colecoes[0]?.id ?? "");

  function enviar(dados: FormData) {
    setResultado(null);
    startTransition(async () => {
      const r = await adicionarFonte({
        url: String(dados.get("url") ?? ""),
        nome: String(dados.get("nome") ?? ""),
        topicId: colecao,
        novaColecao: String(dados.get("nova_colecao") ?? ""),
      });
      setResultado(r);
    });
  }

  return (
    <form action={enviar} className="flex max-w-[620px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-text-secondary">Endereço do site</span>
        <input name="url" required placeholder="ex.: tecmundo.com.br" className={campo} />
        <span className="text-xs text-text-muted">Também aceita o link de um feed RSS, se você tiver.</span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-text-secondary">Coleção</span>
          <select value={colecao} onChange={(e) => setColecao(e.target.value)} className={campo}>
            {colecoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="">+ Nova coleção</option>
          </select>
        </label>
        {colecao === "" ? (
          <label className="animate-fade-up flex flex-col gap-1.5">
            <span className="text-[13px] text-text-secondary">Nome da nova coleção</span>
            <input name="nova_colecao" required placeholder="Ex.: Games" className={campo} />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-text-secondary">Nome (opcional)</span>
            <input name="nome" placeholder="Se ficar vazio, usamos o do site" className={campo} />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="h-10 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Procurando notícias…" : "Seguir"}
        </button>
      </div>

      {resultado?.erro && (
        <p className="animate-fade-up text-sm text-red-500">
          {resultado.erro}
          {resultado.fonteId && (
            <Link href={`/feeds/fonte/${resultado.fonteId}`} className="ml-2 text-accent underline">
              Ver fonte
            </Link>
          )}
        </p>
      )}
      {resultado?.fonteId && !resultado.erro && (
        <div className="animate-fade-up flex flex-col gap-1 rounded-md border border-accent/40 bg-accent-soft/50 p-4 text-sm">
          <span className="font-semibold text-foreground">Pronto! Você está seguindo {resultado.nome}.</span>
          <span className="text-text-secondary">{resumoDaAdicao(resultado)}</span>
          <Link href={`/feeds/fonte/${resultado.fonteId}`} className="mt-1 w-fit text-accent hover:underline">
            Ver notícias →
          </Link>
        </div>
      )}
    </form>
  );
}

/** "Na web": o veículo procurado pelo nome, quando não está no catálogo
 * (ou pra achar outros com nome parecido). Carrega depois da lista do
 * catálogo, porque abre os sites de verdade. */
export function BuscaNaWeb({
  termo,
  colecoes,
  colecaoPreferida,
}: {
  termo: string;
  colecoes: Colecao[];
  colecaoPreferida?: Colecao;
}) {
  const [resultado, setResultado] = useState<{ termo: string; fontes: FonteNaWeb[] } | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarFontesNaWeb(termo)
      .then((fontes) => ativo && setResultado({ termo, fontes }))
      .catch(() => ativo && setResultado({ termo, fontes: [] }));
    return () => {
      ativo = false;
    };
  }, [termo]);

  const carregando = resultado?.termo !== termo;
  if (!carregando && resultado.fontes.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">Na web</h2>
      {carregando ? (
        <p className="animate-pulse py-4 text-[13px] text-text-muted">Procurando &quot;{termo}&quot; na web…</p>
      ) : (
        resultado.fontes.map((f) => (
          <LinhaFonte key={f.url} nome={f.nome} host={f.host}>
            <BotaoSeguir url={f.url} nome={f.nome} colecoes={colecoes} colecaoPreferida={colecaoPreferida} />
          </LinhaFonte>
        ))
      )}
    </section>
  );
}

/** Uma fonte na lista do "Seguir fontes": ícone, nome, site e o botão. */
export function LinhaFonte({
  nome,
  host,
  detalhe,
  descricao,
  children,
}: {
  nome: string;
  host: string;
  detalhe?: string;
  descricao?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up -mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-surface-hover/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconDe(host)}
        alt=""
        className="aspect-square h-12 w-12 flex-shrink-0 rounded-md bg-surface p-2 ring-1 ring-border"
      />
      <div className="flex min-w-0 flex-grow flex-col gap-0.5">
        <div className="truncate text-[15px] font-semibold text-foreground">{nome}</div>
        <div className="truncate text-[13px] text-text-muted">
          {host}
          {detalhe && ` · ${detalhe}`}
        </div>
        {descricao && <div className="hidden truncate text-[13px] text-text-secondary sm:block">{descricao}</div>}
      </div>
      {children}
    </div>
  );
}
