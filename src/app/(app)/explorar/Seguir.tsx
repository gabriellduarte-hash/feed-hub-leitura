"use client";

import { useActionState, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { ItemMenu, Menu, SeparadorMenu } from "@/components/Menu";
import { mostrarToast } from "@/components/Toast";
import { seguirFeedDoCatalogo, seguirPorUrl } from "./actions";

type Colecao = { id: string; nome: string };

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
    const dados = new FormData();
    dados.set("catalog_id", catalogoId);
    dados.set("topic_id", colecao?.id ?? "");
    setSeguindo(true);
    startTransition(async () => {
      const resultado = await seguirFeedDoCatalogo(dados);
      if (resultado?.erro) {
        setSeguindo(false);
        mostrarToast(resultado.erro);
      } else {
        mostrarToast(`Seguindo ${nome} em ${colecao?.nome ?? categoria}`);
      }
    });
  }

  const classe =
    "flex h-8 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60";

  if (seguindo) {
    return (
      <span className="animate-fade-up flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary">
        <Icon nome="check" tamanho={15} />
        {pendente ? "Seguindo..." : "Seguindo"}
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

export function SeguirPorUrlForm({
  colecoes,
  colecaoPreferida,
}: {
  colecoes: Colecao[];
  colecaoPreferida?: string;
}) {
  const [estado, action, pendente] = useActionState(seguirPorUrl, undefined);
  const [colecao, setColecao] = useState(colecaoPreferida ?? colecoes[0]?.id ?? "");

  const campo =
    "h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted";

  return (
    <form action={action} className="flex max-w-[620px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-text-secondary">URL do feed RSS ou da página</span>
        <input name="url" required placeholder="https://site.com.br/feed" className={campo} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-text-secondary">Nome (opcional)</span>
          <input name="name" placeholder="Ex.: Meu blog favorito" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-text-secondary">Tipo</span>
          <select name="type" className={campo}>
            <option value="rss">Feed RSS</option>
            <option value="scrape">Página (extrair texto)</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-text-secondary">Coleção</span>
          <select
            name="topic_id"
            value={colecao}
            onChange={(e) => setColecao(e.target.value)}
            className={campo}
          >
            {colecoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="">+ Nova coleção</option>
          </select>
        </label>
        {colecao === "" && (
          <label className="animate-fade-up flex flex-col gap-1.5">
            <span className="text-[13px] text-text-secondary">Nome da nova coleção</span>
            <input name="nova_colecao" required placeholder="Ex.: Games" className={campo} />
          </label>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pendente ? "Adicionando..." : "Seguir"}
        </button>
        {estado?.erro && <p className="text-sm text-red-500">{estado.erro}</p>}
        {estado?.ok && <p className="animate-fade-up text-sm text-accent">{estado.ok}</p>}
      </div>
    </form>
  );
}
