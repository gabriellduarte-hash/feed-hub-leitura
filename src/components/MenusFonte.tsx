"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  definirFavorita,
  deixarDeSeguir,
  excluirColecao,
  moverFonte,
  renomearColecao,
  renomearFonte,
} from "@/app/actions/fontes";
import { marcarTudoComoLido } from "@/app/actions/artigos";
import { ItemMenu, SeparadorMenu } from "./Menu";
import { mostrarToast } from "./Toast";

export type FonteMenu = { id: string; nome: string; favorita: boolean; topicoId: string };
export type ColecaoMenu = { id: string; nome: string };

export function ItensMenuFonte({
  fonte,
  colecoes,
  fechar,
  naPagina,
}: {
  fonte: FonteMenu;
  colecoes: ColecaoMenu[];
  fechar: () => void;
  naPagina: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const outras = colecoes.filter((c) => c.id !== fonte.topicoId);

  function executar(acao: () => Promise<unknown>, mensagem?: string) {
    fechar();
    startTransition(async () => {
      const resultado = (await acao()) as { erro?: string } | undefined;
      mostrarToast(resultado?.erro ?? mensagem ?? "");
    });
  }

  return (
    <>
      <ItemMenu
        icone="check"
        onClick={() =>
          executar(() => marcarTudoComoLido({ tipo: "fonte", id: fonte.id }), "Marcado como lido")
        }
      >
        Marcar como lido
      </ItemMenu>
      <ItemMenu
        icone="lapis"
        onClick={() => {
          const nome = window.prompt("Novo nome da fonte", fonte.nome);
          if (nome) executar(() => renomearFonte(fonte.id, nome), "Fonte renomeada");
          else fechar();
        }}
      >
        Renomear
      </ItemMenu>
      <ItemMenu
        icone="coracao"
        onClick={() =>
          executar(
            () => definirFavorita(fonte.id, !fonte.favorita),
            fonte.favorita ? "Removida dos favoritos" : "Adicionada aos favoritos",
          )
        }
      >
        {fonte.favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      </ItemMenu>
      {outras.length > 0 && (
        <>
          <SeparadorMenu />
          <div className="px-3 pt-1 pb-0.5 text-[11px] text-text-muted">Mover para</div>
          {outras.map((c) => (
            <ItemMenu
              key={c.id}
              icone="mover"
              onClick={() => executar(() => moverFonte(fonte.id, c.id), `Movida para ${c.nome}`)}
            >
              {c.nome}
            </ItemMenu>
          ))}
        </>
      )}
      <ItemMenu
        icone="semelhantes"
        onClick={() => {
          fechar();
          router.push("/explorar");
        }}
      >
        Ver fontes semelhantes
      </ItemMenu>
      <SeparadorMenu />
      <ItemMenu
        icone="lixeira"
        perigo
        onClick={() => {
          if (window.confirm(`Deixar de seguir ${fonte.nome}? As notícias dela vão sair do seu feed.`)) {
            executar(() => deixarDeSeguir(fonte.id, naPagina), `Você deixou de seguir ${fonte.nome}`);
          } else fechar();
        }}
      >
        Deixar de seguir
      </ItemMenu>
    </>
  );
}

export function ItensMenuColecao({
  colecao,
  fechar,
  naPagina,
}: {
  colecao: ColecaoMenu;
  fechar: () => void;
  naPagina: boolean;
}) {
  const [, startTransition] = useTransition();

  function executar(acao: () => Promise<unknown>, mensagem: string) {
    fechar();
    startTransition(async () => {
      const resultado = (await acao()) as { erro?: string } | undefined;
      mostrarToast(resultado?.erro ?? mensagem);
    });
  }

  return (
    <>
      <ItemMenu
        icone="check"
        onClick={() =>
          executar(() => marcarTudoComoLido({ tipo: "colecao", id: colecao.id }), "Marcado como lido")
        }
      >
        Marcar como lido
      </ItemMenu>
      <ItemMenu
        icone="lapis"
        onClick={() => {
          const nome = window.prompt("Novo nome da coleção", colecao.nome);
          if (nome) executar(() => renomearColecao(colecao.id, nome), "Coleção renomeada");
          else fechar();
        }}
      >
        Renomear
      </ItemMenu>
      <SeparadorMenu />
      <ItemMenu
        icone="lixeira"
        perigo
        onClick={() => {
          if (
            window.confirm(
              `Excluir a coleção ${colecao.nome}? Você vai deixar de seguir todas as fontes dela.`,
            )
          ) {
            executar(() => excluirColecao(colecao.id, naPagina), "Coleção excluída");
          } else fechar();
        }}
      >
        Excluir coleção
      </ItemMenu>
    </>
  );
}
