"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { faviconDe } from "@/lib/fonte";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon, type NomeIcone } from "./Icon";
import { ItemMenu, Menu, SeparadorMenu } from "./Menu";
import { ItensMenuColecao, ItensMenuFonte } from "./MenusFonte";
import { ThemeToggle } from "./ThemeToggle";

export type FonteSidebar = {
  id: string;
  nome: string;
  host: string;
  naoLidos: number;
  favorita: boolean;
  topicoId: string;
};

export type ColecaoSidebar = {
  id: string;
  nome: string;
  naoLidos: number;
  fontes: FonteSidebar[];
};

export type DadosSidebar = {
  colecoes: ColecaoSidebar[];
  totalNaoLidos: number;
  email: string;
};

export function Sidebar({
  dados,
  onRecolher,
  onIrPara,
}: {
  dados: DadosSidebar;
  onRecolher: () => void;
  onIrPara: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [fechadasJson, setFechadasJson] = useLocalStorage("colecoes-fechadas", "[]");
  const fechadas = useMemo(() => {
    try {
      return new Set(JSON.parse(fechadasJson) as string[]);
    } catch {
      return new Set<string>();
    }
  }, [fechadasJson]);

  function alternarColecao(id: string) {
    const novo = new Set(fechadas);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setFechadasJson(JSON.stringify([...novo]));
  }

  async function sair() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nomeUsuario = dados.email.split("@")[0];
  const colecoesMenu = dados.colecoes.map((c) => ({ id: c.id, nome: c.nome }));
  const favoritas = dados.colecoes.flatMap((c) => c.fontes).filter((f) => f.favorita);

  return (
    <nav className="flex h-full w-[270px] flex-col overflow-y-auto border-r border-border bg-sidebar px-2 pb-6 text-[14px]">
      <div className="flex h-14 flex-shrink-0 items-center justify-between pr-1 pl-1">
        <Menu
          largura="w-64"
          rotulo="Menu da conta"
          classeGatilho="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
          gatilho={
            <>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {nomeUsuario.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[150px] truncate font-semibold text-foreground">
                Feed de {nomeUsuario}
              </span>
              <Icon nome="chevronBaixo" tamanho={16} className="text-text-secondary" />
            </>
          }
        >
          {(fechar) => (
            <>
              <div className="truncate px-3 py-2 text-xs text-text-muted">{dados.email}</div>
              <ThemeToggle />
              <SeparadorMenu />
              <LinkMenu href="/fontes" fechar={fechar}>
                Organizar fontes
              </LinkMenu>
              <LinkMenu href="/compartilhar" fechar={fechar}>
                Compartilhar resumo diário
              </LinkMenu>
              <SeparadorMenu />
              <ItemMenu onClick={sair}>Sair</ItemMenu>
            </>
          )}
        </Menu>
        <button
          type="button"
          onClick={onRecolher}
          title="Recolher menu"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Icon nome="painel" />
        </button>
      </div>

      <div className="flex flex-col gap-px">
        <ItemNav href="/" icone="hoje" ativo={pathname === "/"}>
          Hoje
        </ItemNav>
        <ItemNav href="/explorar" icone="rss" ativo={pathname.startsWith("/explorar")}>
          Seguir fontes
        </ItemNav>
        <ItemNav href="/buscar" icone="buscar" ativo={pathname.startsWith("/buscar")}>
          Buscar
        </ItemNav>
        <button
          type="button"
          onClick={onIrPara}
          className="group flex items-center gap-3 rounded-md px-2.5 py-[7px] text-left text-foreground transition-colors hover:bg-surface-hover"
        >
          <Icon nome="externo" tamanho={17} className="text-text-secondary" />
          Ir para...
          <kbd className="ml-auto rounded border border-border px-1.5 text-[10px] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-px">
        <ItemNav href="/ler-mais-tarde" icone="marcador" ativo={pathname.startsWith("/ler-mais-tarde")}>
          Ler mais tarde
        </ItemNav>
        <ItemNav
          href="/lidos-recentemente"
          icone="relogio"
          ativo={pathname.startsWith("/lidos-recentemente")}
        >
          Lidos recentemente
        </ItemNav>
      </div>

      {favoritas.length > 0 && (
        <>
          <TituloSecao>Favoritos</TituloSecao>
          <div className="flex flex-col gap-px">
            {favoritas.map((fonte) => (
              <LinhaFonte
                key={fonte.id}
                fonte={fonte}
                recuo={false}
                pathname={pathname}
                colecoes={colecoesMenu}
              />
            ))}
          </div>
        </>
      )}

      <TituloSecao>Feeds</TituloSecao>
      <div className="flex flex-col gap-px">
        <ItemNav
          href="/feeds/todos"
          icone="lista"
          ativo={pathname === "/feeds/todos"}
          contador={dados.totalNaoLidos}
        >
          Todos
        </ItemNav>

        {dados.colecoes.map((colecao) => {
          const aberta = !fechadas.has(colecao.id);
          const href = `/feeds/colecao/${colecao.id}`;
          const ativa = pathname === href;
          return (
            <div key={colecao.id} className="flex flex-col gap-px">
              <div
                className={`group relative flex items-center rounded-md transition-colors ${
                  ativa ? "bg-surface-active" : "hover:bg-surface-hover"
                }`}
              >
                <button
                  type="button"
                  onClick={() => alternarColecao(colecao.id)}
                  aria-label={aberta ? "Recolher coleção" : "Expandir coleção"}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-text-secondary hover:text-foreground"
                >
                  <Icon
                    nome="chevronBaixo"
                    tamanho={16}
                    className={`transition-transform duration-200 ${aberta ? "" : "-rotate-90"}`}
                  />
                </button>
                <Link href={href} className="min-w-0 flex-grow truncate py-[7px] text-foreground">
                  {colecao.nome}
                </Link>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
                  <Menu
                    alinhar="direita"
                    rotulo="Opções da coleção"
                    gatilho={<Icon nome="mais" tamanho={16} />}
                    classeGatilho={classeAcaoLinha}
                  >
                    {(fechar) => (
                      <ItensMenuColecao
                        colecao={{ id: colecao.id, nome: colecao.nome }}
                        fechar={fechar}
                        naPagina={ativa}
                      />
                    )}
                  </Menu>
                  <Link
                    href={`/explorar?colecao=${colecao.id}`}
                    title="Adicionar fonte nesta coleção"
                    className={classeAcaoLinha}
                  >
                    <Icon nome="adicionar" tamanho={16} />
                  </Link>
                </div>
                <Contador valor={colecao.naoLidos} />
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  aberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="flex flex-col gap-px overflow-hidden">
                  {colecao.fontes.map((fonte) => (
                    <LinhaFonte
                      key={fonte.id}
                      fonte={fonte}
                      recuo
                      pathname={pathname}
                      colecoes={colecoesMenu}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {dados.colecoes.length === 0 && (
          <Link
            href="/explorar"
            className="px-2.5 py-2 text-[13px] text-accent transition-opacity hover:opacity-80"
          >
            + Seguir suas primeiras fontes
          </Link>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-px">
        <ItemNav href="/compartilhar" icone="enviar" ativo={pathname.startsWith("/compartilhar")}>
          Compartilhar resumo diário
        </ItemNav>
        <ItemNav href="/fontes" icone="organizar" ativo={pathname.startsWith("/fontes")}>
          Organizar fontes
        </ItemNav>
      </div>
    </nav>
  );
}

const classeAcaoLinha =
  "flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-active hover:text-foreground";

function TituloSecao({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 mb-1.5 px-2.5 text-[13px] text-text-muted">{children}</div>;
}

function Contador({ valor }: { valor: number }) {
  return (
    <span className="w-9 flex-shrink-0 pr-2.5 text-right text-[11px] text-text-muted tabular-nums">
      {valor > 0 ? valor : ""}
    </span>
  );
}

function ItemNav({
  href,
  icone,
  ativo,
  contador,
  children,
}: {
  href: string;
  icone: NomeIcone;
  ativo: boolean;
  contador?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md py-[7px] pl-2.5 transition-colors duration-150 ${
        ativo ? "bg-surface-active text-foreground" : "text-foreground hover:bg-surface-hover"
      } ${contador === undefined ? "pr-2.5" : ""}`}
    >
      <Icon nome={icone} tamanho={17} className="flex-shrink-0 text-text-secondary" />
      <span className="flex-grow truncate">{children}</span>
      {contador !== undefined && <Contador valor={contador} />}
    </Link>
  );
}

function LinhaFonte({
  fonte,
  recuo,
  pathname,
  colecoes,
}: {
  fonte: FonteSidebar;
  recuo: boolean;
  pathname: string;
  colecoes: { id: string; nome: string }[];
}) {
  const href = `/feeds/fonte/${fonte.id}`;
  const ativa = pathname === href;
  return (
    <div
      className={`group relative flex items-center rounded-md transition-colors ${
        ativa ? "bg-surface-active" : "hover:bg-surface-hover"
      }`}
    >
      <Link
        href={href}
        className={`flex min-w-0 flex-grow items-center gap-2.5 py-[7px] ${recuo ? "pl-8" : "pl-2.5"} ${
          fonte.naoLidos === 0 ? "text-text-secondary" : "text-foreground"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faviconDe(fonte.host)} alt="" className="h-4 w-4 flex-shrink-0 rounded-sm" />
        <span className="truncate">{fonte.nome}</span>
      </Link>
      <div className="opacity-0 transition-opacity group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
        <Menu
          alinhar="direita"
          rotulo="Opções da fonte"
          gatilho={<Icon nome="mais" tamanho={16} />}
          classeGatilho={classeAcaoLinha}
        >
          {(fechar) => (
            <ItensMenuFonte
              fonte={{ id: fonte.id, nome: fonte.nome, favorita: fonte.favorita, topicoId: fonte.topicoId }}
              colecoes={colecoes}
              fechar={fechar}
              naPagina={ativa}
            />
          )}
        </Menu>
      </div>
      <Contador valor={fonte.naoLidos} />
    </div>
  );
}

function LinkMenu({
  href,
  fechar,
  children,
}: {
  href: string;
  fechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={fechar}
      className="flex w-full rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
    >
      {children}
    </Link>
  );
}
