"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { marcarTudoComoLido, type Escopo } from "@/app/actions/artigos";
import { definirFavorita } from "@/app/actions/fontes";
import { Icon, type NomeIcone } from "./Icon";
import { Menu } from "./Menu";
import { ItensMenuColecao, ItensMenuFonte, type ColecaoMenu, type FonteMenu } from "./MenusFonte";
import { mostrarToast } from "./Toast";
import { usePreferencias } from "@/lib/usePreferencias";

const classeBotao =
  "relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-hover hover:text-foreground active:scale-90";

export function FeedActions({
  escopo,
  naoLidos,
  fonte,
  colecao,
  colecoes = [],
}: {
  escopo: Escopo;
  naoLidos?: number;
  fonte?: FonteMenu;
  colecao?: ColecaoMenu;
  colecoes?: ColecaoMenu[];
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [girando, setGirando] = useState(false);

  const [preferencias] = usePreferencias();

  function marcarTudo() {
    if (preferencias.confirmarMarcarTudo && !window.confirm(`Marcar ${naoLidos ?? "todos os"} artigos como lidos?`)) return;
    startTransition(async () => {
      await marcarTudoComoLido(escopo);
      mostrarToast("Tudo marcado como lido");
    });
  }

  function atualizar() {
    setGirando(true);
    router.refresh();
    setTimeout(() => setGirando(false), 600);
  }

  return (
    <>
      <button
        type="button"
        title="Marcar tudo como lido"
        onClick={marcarTudo}
        disabled={pendente}
        className={classeBotao}
      >
        {!!naoLidos && (
          <span className="absolute -top-0.5 left-1 text-[10px] leading-none text-text-muted">
            {naoLidos}
          </span>
        )}
        <Icon nome="check" />
      </button>

      {fonte && (
        <BotaoFavorito fonte={fonte} />
      )}

      <button type="button" title="Atualizar" onClick={atualizar} className={classeBotao}>
        <Icon
          nome="atualizar"
          className={girando ? "animate-spin [animation-direction:reverse]" : ""}
        />
      </button>

      <Menu
        alinhar="direita"
        rotulo="Mais opções"
        gatilho={<Icon nome="mais" />}
        classeGatilho={classeBotao}
      >
        {(fechar) =>
          fonte ? (
            <ItensMenuFonte fonte={fonte} colecoes={colecoes} fechar={fechar} naPagina />
          ) : colecao ? (
            <ItensMenuColecao colecao={colecao} fechar={fechar} naPagina />
          ) : (
            <>
              <LinkMenu href="/fontes" icone="organizar" fechar={fechar}>
                Organizar fontes
              </LinkMenu>
              <LinkMenu href="/explorar" icone="adicionar" fechar={fechar}>
                Seguir novas fontes
              </LinkMenu>
            </>
          )
        }
      </Menu>
    </>
  );
}

function BotaoFavorito({ fonte }: { fonte: FonteMenu }) {
  const [favorita, setFavorita] = useState(fonte.favorita);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={() => {
        const novo = !favorita;
        setFavorita(novo);
        startTransition(async () => {
          const resultado = await definirFavorita(fonte.id, novo);
          if (resultado?.erro) {
            setFavorita(!novo);
            mostrarToast(resultado.erro);
          }
        });
      }}
      className={`${classeBotao} ${favorita ? "text-accent hover:text-accent" : ""}`}
    >
      <Icon
        nome="coracao"
        preenchido={favorita}
        className={`transition-transform duration-200 ${favorita ? "scale-110" : ""}`}
      />
    </button>
  );
}

function LinkMenu({
  href,
  icone,
  fechar,
  children,
}: {
  href: string;
  icone: NomeIcone;
  fechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={fechar}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
    >
      <Icon nome={icone} tamanho={16} className="text-text-secondary" />
      {children}
    </Link>
  );
}

