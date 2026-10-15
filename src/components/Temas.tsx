"use client";

import Link from "next/link";
import { hrefDoTema, idDoItem, ordenarTemas, rotuloDoTema, type ItemSeguido } from "@/lib/seguir";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon } from "./Icon";
import { ItemMenu, Menu } from "./Menu";
import { useSeguindo } from "./Seguindo";

/* Temas e nomes seguidos (sql/045 e 046) no menu, abaixo das coleções,
 * como as fontes: cada um abre a página das notícias dele e mostra
 * quantas histórias chegaram hoje (zera à meia-noite). A lista vem do
 * ProvedorSeguindo, então quem segue pelo leitor já vê o tema aqui. */

/** contagem: idDoItem -> histórias de hoje (contagem_seguidos, no layout) */
export type ContagemTemas = Record<string, number>;

function IconeDoTema({ item, tamanho }: { item: ItemSeguido; tamanho: number }) {
  return (
    <Icon
      nome={item.tipo === "tema" ? "hashtag" : "etiqueta"}
      tamanho={tamanho}
      className="flex-shrink-0 text-text-secondary"
    />
  );
}

function Contador({ valor, classe }: { valor: number; classe: string }) {
  if (!valor) return null;
  return (
    <span title={`${valor} ${valor === 1 ? "notícia" : "notícias"} hoje`} className={`tabular-nums text-text-muted ${classe}`}>
      {valor}
    </span>
  );
}

function MenuDoTema({ item, classeGatilho }: { item: ItemSeguido; classeGatilho: string }) {
  const { alternar } = useSeguindo();
  return (
    <Menu alinhar="direita" rotulo={`Opções de ${item.rotulo}`} gatilho={<Icon nome="mais" tamanho={16} />} classeGatilho={classeGatilho}>
      {(fechar) => (
        <ItemMenu
          icone="fechar"
          onClick={() => {
            fechar();
            alternar(item);
          }}
        >
          Deixar de seguir
        </ItemMenu>
      )}
    </Menu>
  );
}

const classeAcaoLinha =
  "flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-active hover:text-foreground";

/** Menu lateral (computador). */
export function SubmenuTemas({ pathname, contagem }: { pathname: string; contagem: ContagemTemas }) {
  const { itens } = useSeguindo();
  const [aberto, setAberto] = useLocalStorage("submenu-temas", "1");
  const temas = ordenarTemas(itens);

  return (
    <div className="animate-aparece mt-6 flex flex-col text-[13px]">
      <div className="group mb-2 flex h-8 items-center rounded-md">
        <button
          type="button"
          onClick={() => setAberto(aberto === "1" ? "0" : "1")}
          aria-expanded={aberto === "1"}
          className="flex h-8 min-w-0 flex-grow items-center gap-2 px-1 text-[12px] font-medium text-text-muted transition-colors hover:text-foreground"
        >
          <Icon nome="chevronBaixo" tamanho={14} className={`transition-transform duration-200 ${aberto === "1" ? "" : "-rotate-90"}`} />
          Temas
        </button>
        <Link
          href="/explorar?aba=temas"
          title="Seguir um tema"
          className={`${classeAcaoLinha} opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100`}
        >
          <Icon nome="adicionar" tamanho={16} />
        </Link>
      </div>

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${aberto === "1" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="flex flex-col gap-1 overflow-hidden">
          {temas.length > 0 && (
            <Link
              href="/feeds/temas"
              className={`flex items-center gap-3 rounded-md py-[7px] pl-2 transition-colors ${
                pathname === "/feeds/temas" ? "bg-surface-active text-foreground" : "text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon nome="camadas" tamanho={18} className="text-text-secondary" />
              <span className="flex-grow font-semibold">Todos os temas</span>
            </Link>
          )}
          {temas.map((item) => {
            const href = hrefDoTema(item);
            const ativa = pathname === href;
            const novas = contagem[idDoItem(item)] ?? 0;
            return (
              <div
                key={idDoItem(item)}
                className={`group relative flex items-center rounded-md transition-colors ${ativa ? "bg-surface-active" : "hover:bg-surface-hover"}`}
              >
                <Link
                  href={href}
                  className={`flex min-w-0 flex-grow items-center gap-2.5 py-2 pl-2 ${novas ? "text-foreground" : "text-text-secondary"}`}
                >
                  <IconeDoTema item={item} tamanho={16} />
                  <span className="truncate">{rotuloDoTema(item)}</span>
                </Link>
                <div className="opacity-0 transition-opacity group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
                  <MenuDoTema item={item} classeGatilho={classeAcaoLinha} />
                </div>
                <span className="ml-auto flex w-10 flex-shrink-0 justify-end pr-2">
                  <Contador valor={novas} classe="px-1.5 text-[11px]" />
                </span>
              </div>
            );
          })}
          <Link
            href="/explorar?aba=temas"
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-accent transition-colors hover:bg-accent-soft"
          >
            <Icon nome="adicionar" tamanho={16} />
            {temas.length ? "Seguir outro tema" : "Seguir temas, pessoas, times"}
          </Link>
        </div>
      </div>
    </div>
  );
}

const botaoAcao =
  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover active:bg-surface-active";

/** Página Coleções (celular): mesma lista, com os botões sempre à mostra. */
export function SecaoTemas({ contagem }: { contagem: ContagemTemas }) {
  const { itens } = useSeguindo();
  const temas = ordenarTemas(itens);
  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 px-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">Temas</h2>
        <Link href="/explorar?aba=temas" aria-label="Seguir um tema" className={`${botaoAcao} -mt-2`}>
          <Icon nome="adicionar" tamanho={18} />
        </Link>
      </div>
      {temas.length === 0 ? (
        <Link href="/explorar?aba=temas" className="px-2 py-3 text-[13px] text-text-muted">
          Siga temas, pessoas, times ou empresas: as notícias deles aparecem aqui, como as das fontes.{" "}
          <span className="font-semibold text-accent">Seguir temas</span>
        </Link>
      ) : (
        <>
          <Link
            href="/feeds/temas"
            className="flex h-12 items-center gap-3 rounded-md px-2 transition-colors hover:bg-surface-hover active:bg-surface-active"
          >
            <Icon nome="camadas" tamanho={20} className="text-text-secondary" />
            <span className="flex-grow text-[15px] font-bold text-foreground">Todos os temas</span>
          </Link>
          {temas.map((item) => {
            const novas = contagem[idDoItem(item)] ?? 0;
            return (
              <div key={idDoItem(item)} className="flex items-center rounded-md transition-colors hover:bg-surface-hover">
                <Link
                  href={hrefDoTema(item)}
                  className={`flex min-w-0 flex-grow items-center gap-3 py-2.5 pl-2 ${novas ? "text-foreground" : "text-text-secondary"}`}
                >
                  <IconeDoTema item={item} tamanho={18} />
                  <span className="truncate text-[14px]">{rotuloDoTema(item)}</span>
                </Link>
                <Contador valor={novas} classe="px-2 text-[12px]" />
                <MenuDoTema item={item} classeGatilho={botaoAcao} />
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

/** Página de um tema: seguir ou deixar de seguir dali mesmo. */
export function BotaoSeguirTema({ item }: { item: ItemSeguido }) {
  const { segue, alternar } = useSeguindo();
  const ativo = segue(item);
  return (
    <button
      type="button"
      onClick={() => alternar(item)}
      aria-pressed={ativo}
      className={`flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-semibold transition active:scale-[0.97] ${
        ativo
          ? "border border-accent bg-accent-soft text-accent hover:bg-transparent"
          : "bg-foreground text-background hover:bg-accent"
      }`}
    >
      <Icon nome={ativo ? "check" : "adicionar"} tamanho={15} espessura={2} />
      {ativo ? "Seguindo" : "Seguir"}
    </button>
  );
}
