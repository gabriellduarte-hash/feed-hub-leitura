"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { criarColecao } from "@/app/actions/fontes";
import { marcarTudoComoLido } from "@/app/actions/artigos";
import { faviconDe } from "@/lib/fonte";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useDadosApp } from "./AppShell";
import { SecaoResumo } from "./Configuracoes";
import { Icon } from "./Icon";
import { ItemMenu, Menu, SeparadorMenu } from "./Menu";
import { ItensMenuColecao, ItensMenuFonte } from "./MenusFonte";
import type { FonteSidebar } from "./Sidebar";
import { mostrarToast } from "./Toast";

/* A página Feeds: no celular é onde ficam as coleções e as fontes (no
 * computador elas também estão no menu lateral). Mesmas ações do menu
 * lateral, com os botões sempre à mostra (no toque não existe "passar o
 * mouse"), e as configurações do resumo diário no fim. */

const botaoAcao =
  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover active:bg-surface-active";

export function PaginaFeeds() {
  const dados = useDadosApp();
  const [, startTransition] = useTransition();
  // mesma chave do menu lateral: recolher aqui recolhe lá também
  const [fechadasJson, setFechadasJson] = useLocalStorage("colecoes-fechadas", "[]");
  const fechadas = useMemo(() => {
    try {
      return new Set(JSON.parse(fechadasJson) as string[]);
    } catch {
      return new Set<string>();
    }
  }, [fechadasJson]);

  const colecoesMenu = dados.colecoes.map((c) => ({ id: c.id, nome: c.nome }));
  const favoritas = dados.colecoes.flatMap((c) => c.fontes).filter((f) => f.favorita);
  const todasFechadas = dados.colecoes.length > 0 && dados.colecoes.every((c) => fechadas.has(c.id));

  function alternar(id: string) {
    const novo = new Set(fechadas);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setFechadasJson(JSON.stringify([...novo]));
  }

  function novaColecao() {
    const nome = window.prompt("Nome da nova coleção");
    if (!nome?.trim()) return;
    startTransition(async () => {
      const resultado = await criarColecao(nome);
      mostrarToast(resultado?.erro ?? `Coleção ${nome.trim()} criada`);
    });
  }

  function marcarTudo() {
    if (!window.confirm("Marcar todas as notícias como lidas?")) return;
    startTransition(async () => {
      await marcarTudoComoLido({ tipo: "todos" });
      mostrarToast("Tudo marcado como lido");
    });
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-8 pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/explorar"
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-[13px] font-semibold whitespace-nowrap text-background transition-colors hover:bg-accent active:scale-[0.98] sm:flex-none sm:px-4"
        >
          <Icon nome="adicionar" tamanho={16} espessura={2} />
          Adicionar fonte
        </Link>
        <button
          type="button"
          onClick={novaColecao}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 text-[13px] font-medium whitespace-nowrap text-foreground transition-colors hover:border-accent hover:text-accent sm:flex-none sm:px-4"
        >
          <Icon nome="lista" tamanho={16} />
          Nova coleção
        </button>
      </div>

      <section className="flex flex-col">
        <Link
          href="/feeds/todos"
          className="flex h-12 items-center gap-3 rounded-md px-2 transition-colors hover:bg-surface-hover active:bg-surface-active"
        >
          <Icon nome="camadas" tamanho={20} className="text-text-secondary" />
          <span className="flex-grow text-[15px] font-bold text-foreground">Todos</span>
          <Contador valor={dados.totalNaoLidos} destaque />
        </Link>
      </section>

      {favoritas.length > 0 && (
        <section className="flex flex-col">
          <Titulo>Favoritos</Titulo>
          {favoritas.map((f) => (
            <LinhaFonte key={`fav-${f.id}`} fonte={f} colecoes={colecoesMenu} recuo={false} />
          ))}
        </section>
      )}

      <section className="flex flex-col">
        <div className="flex items-center justify-between">
          <Titulo>Coleções</Titulo>
          <Menu rotulo="Opções das coleções" alinhar="direita" gatilho={<Icon nome="mais" tamanho={18} />} classeGatilho={`${botaoAcao} -mt-2`}>
            {(fechar) => (
              <>
                <Link
                  href="/fontes"
                  onClick={fechar}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
                >
                  <Icon nome="organizar" tamanho={16} className="text-text-secondary" />
                  Organizar fontes
                </Link>
                <ItemMenu
                  icone="check"
                  onClick={() => {
                    fechar();
                    marcarTudo();
                  }}
                >
                  Marcar tudo como lido
                </ItemMenu>
                <SeparadorMenu />
                <ItemMenu
                  icone="chevronBaixo"
                  onClick={() => {
                    fechar();
                    setFechadasJson(JSON.stringify(todasFechadas ? [] : dados.colecoes.map((c) => c.id)));
                  }}
                >
                  {todasFechadas ? "Expandir todas" : "Recolher todas"}
                </ItemMenu>
              </>
            )}
          </Menu>
        </div>
        {dados.colecoes.length === 0 && (
          <p className="px-2 py-3 text-[13px] text-text-muted">
            Você ainda não tem coleções. Crie uma ou adicione uma fonte para começar.
          </p>
        )}
        {dados.colecoes.map((colecao) => {
          const aberta = !fechadas.has(colecao.id);
          return (
            <div key={colecao.id} className="flex flex-col border-b border-border py-1 last:border-b-0">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => alternar(colecao.id)}
                  aria-expanded={aberta}
                  aria-label={aberta ? `Recolher ${colecao.nome}` : `Expandir ${colecao.nome}`}
                  className={botaoAcao}
                >
                  <Icon
                    nome="chevronBaixo"
                    tamanho={16}
                    className={`transition-transform duration-200 ${aberta ? "" : "-rotate-90"}`}
                  />
                </button>
                <Link
                  href={`/feeds/colecao/${colecao.id}`}
                  className="min-w-0 flex-grow truncate py-3 text-[15px] font-bold text-foreground"
                >
                  {colecao.nome}
                </Link>
                <Contador valor={colecao.naoLidos} />
                <Link href={`/explorar?colecao=${colecao.id}`} aria-label={`Adicionar fonte em ${colecao.nome}`} className={botaoAcao}>
                  <Icon nome="adicionar" tamanho={18} />
                </Link>
                <Menu
                  alinhar="direita"
                  rotulo={`Opções de ${colecao.nome}`}
                  gatilho={<Icon nome="mais" tamanho={18} />}
                  classeGatilho={botaoAcao}
                >
                  {(fechar) => <ItensMenuColecao colecao={{ id: colecao.id, nome: colecao.nome }} fechar={fechar} naPagina={false} />}
                </Menu>
              </div>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${aberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="flex flex-col overflow-hidden">
                  {colecao.fontes.map((fonte) => (
                    <LinhaFonte key={fonte.id} fonte={fonte} colecoes={colecoesMenu} recuo />
                  ))}
                  {colecao.fontes.length === 0 && (
                    <div className="py-2 pl-12 text-[13px] text-text-muted">Coleção vazia</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 md:p-7">
        <SecaoResumo email={dados.email} colecoes={colecoesMenu} />
      </section>
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">{children}</h2>
  );
}

function Contador({ valor, destaque = false }: { valor: number; destaque?: boolean }) {
  if (valor <= 0) return null;
  return (
    <span className={`px-2 text-[12px] tabular-nums ${destaque ? "font-bold text-accent" : "text-text-muted"}`}>{valor}</span>
  );
}

function LinhaFonte({
  fonte,
  colecoes,
  recuo,
}: {
  fonte: FonteSidebar;
  colecoes: { id: string; nome: string }[];
  recuo: boolean;
}) {
  return (
    <div className="flex items-center rounded-md transition-colors hover:bg-surface-hover">
      <Link
        href={`/feeds/fonte/${fonte.id}`}
        className={`flex min-w-0 flex-grow items-center gap-3 py-2.5 ${recuo ? "pl-12" : "pl-2"} ${
          fonte.naoLidos === 0 ? "text-text-secondary" : "text-foreground"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faviconDe(fonte.host)} alt="" className="h-5 w-5 flex-shrink-0 rounded" />
        <span className="truncate text-[14px]">{fonte.nome}</span>
      </Link>
      <Contador valor={fonte.naoLidos} />
      <Menu alinhar="direita" rotulo={`Opções de ${fonte.nome}`} gatilho={<Icon nome="mais" tamanho={18} />} classeGatilho={botaoAcao}>
        {(fechar) => (
          <ItensMenuFonte
            fonte={{ id: fonte.id, nome: fonte.nome, favorita: fonte.favorita, topicoId: fonte.topicoId }}
            colecoes={colecoes}
            fechar={fechar}
            naPagina={false}
          />
        )}
      </Menu>
    </div>
  );
}
