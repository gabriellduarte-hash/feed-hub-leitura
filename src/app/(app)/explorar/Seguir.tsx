"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adicionarFonte, type ResultadoAdicionar } from "@/app/actions/adicionar-fonte";
import { Icon } from "@/components/Icon";
import { ItemMenu, Menu, SeparadorMenu } from "@/components/Menu";
import { mostrarToast } from "@/components/Toast";

type Colecao = { id: string; nome: string };

export function resumoDaAdicao(r: ResultadoAdicionar) {
  const total = (r.importadas ?? 0) + (r.coletadas ?? 0);
  return total > 0
    ? `${total} ${total === 1 ? "notícia carregada" : "notícias carregadas"}`
    : "sem notícias por enquanto — chegam na próxima coleta";
}

export function BotaoSeguir({
  catalogoId,
  nome,
  categoria,
  colecoes,
  colecaoPreferida,
}: {
  catalogoId: string;
  nome: string;
  categoria: string;
  colecoes: Colecao[];
  colecaoPreferida?: Colecao;
}) {
  const [pendente, startTransition] = useTransition();
  const [seguindo, setSeguindo] = useState(false);

  function seguir(colecao: Colecao | null) {
    setSeguindo(true);
    startTransition(async () => {
      const r = await adicionarFonte({ catalogoId, topicId: colecao?.id, novaColecao: categoria });
      if (r.erro) {
        setSeguindo(false);
        mostrarToast(r.erro);
      } else {
        mostrarToast(
          `Seguindo ${nome} em ${colecao?.nome ?? categoria} · ${resumoDaAdicao(r)}` +
            (r.coletaCompleta && !r.coletaCompleta.ok ? ` · disparo da coleta falhou: ${r.coletaCompleta.motivo}` : ""),
        );
      }
    });
  }

  const classe =
    "flex h-8 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60";

  if (seguindo) {
    return (
      <span className="animate-fade-up flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary">
        <Icon nome="check" tamanho={15} />
        {pendente ? "Carregando notícias…" : "Seguindo"}
      </span>
    );
  }

  if (colecaoPreferida) {
    return (
      <button type="button" onClick={() => seguir(colecaoPreferida)} className={classe}>
        Seguir
      </button>
    );
  }

  const temColecaoDaCategoria = colecoes.some((c) => c.nome === categoria);

  return (
    <Menu alinhar="direita" gatilho="Seguir" classeGatilho={classe} rotulo={`Seguir ${nome}`}>
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
                Nova coleção &quot;{categoria}&quot;
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

/** Formulário "Por URL": cola qualquer link (site ou RSS) e o hub descobre sozinho. */
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
        <span className="text-[13px] text-text-secondary">Endereço do site ou do feed</span>
        <input name="url" required placeholder="ex.: tecmundo.com.br ou https://site.com.br/feed" className={campo} />
        <span className="text-xs text-text-muted">
          Não precisa saber se é RSS: o hub descobre sozinho (RSS, sitemap de notícias ou Google Notícias).
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
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
            <input name="nome" placeholder="Usa o nome do site" className={campo} />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Analisando o site…" : "Seguir"}
        </button>
        {pendente && (
          <span className="animate-pulse text-xs text-text-muted">procurando RSS, sitemap e notícias recentes</span>
        )}
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
        <div className="animate-fade-up flex flex-col gap-1 rounded-xl border border-accent/40 bg-accent-soft/50 p-4 text-sm">
          <span className="font-semibold text-foreground">✓ {resultado.nome} adicionada</span>
          <span className="text-text-secondary">Detectado: {resultado.como}</span>
          <span className="text-text-secondary">{resumoDaAdicao(resultado)}</span>
          {resultado.coletaCompleta && (
            <span className={resultado.coletaCompleta.ok ? "text-text-secondary" : "text-amber-500"}>
              {resultado.coletaCompleta.ok ? "✓ " : "Texto completo e resumo da IA: "}
              {resultado.coletaCompleta.motivo}
            </span>
          )}
          <Link href={`/feeds/fonte/${resultado.fonteId}`} className="mt-1 w-fit text-accent hover:underline">
            Ver notícias →
          </Link>
        </div>
      )}
    </form>
  );
}
