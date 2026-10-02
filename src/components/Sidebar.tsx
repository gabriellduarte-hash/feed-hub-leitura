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

const classeIconeRail =
  "dica group flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-foreground";

/* Trilho de ícones (estilo Substack) */

export function Rail({
  email,
  painelAberto,
  onAlternarPainel,
  onIrPara,
}: {
  email: string;
  painelAberto: boolean;
  onAlternarPainel: () => void;
  onIrPara: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const inicial = (email.charAt(0) || "?").toUpperCase();

  return (
    <nav className="relative z-40 flex h-full w-[76px] flex-shrink-0 flex-col items-center gap-1.5 border-r border-border bg-sidebar py-4">
      <Link
        href="/"
        aria-label="Início"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_6px_20px_-6px_var(--accent)] transition-transform duration-200 hover:scale-105 hover:-rotate-3"
      >
        <Icon nome="rss" tamanho={22} espessura={2.2} />
      </Link>

      <ItemRail href="/" icone="casa" rotulo="Hoje" ativo={pathname === "/"} />
      <ItemRail href="/feeds/todos" icone="camadas" rotulo="Todos os feeds" ativo={pathname.startsWith("/feeds")} />
      <ItemRail
        href="/ler-mais-tarde"
        icone="marcador"
        rotulo="Ler mais tarde"
        ativo={pathname.startsWith("/ler-mais-tarde")}
      />
      <ItemRail
        href="/lidos-recentemente"
        icone="relogio"
        rotulo="Lidos recentemente"
        ativo={pathname.startsWith("/lidos-recentemente")}
      />
      <ItemRail href="/buscar" icone="buscar" rotulo="Buscar" ativo={pathname.startsWith("/buscar")} />
      <button type="button" onClick={onIrPara} aria-label="Ir para" data-dica="Ir para…  Ctrl K" className={classeIconeRail}>
        <Icon nome="comando" tamanho={24} className="transition-transform duration-150 group-hover:scale-110" />
      </button>

      <Link
        href="/explorar"
        aria-label="Seguir fontes"
        data-dica="Seguir fontes"
        className={`dica mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition duration-200 hover:scale-105 hover:brightness-110 active:scale-95 ${
          pathname.startsWith("/explorar") ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-sidebar" : ""
        }`}
      >
        <Icon nome="adicionar" tamanho={26} espessura={2.2} />
      </Link>

      <div className="flex-grow" />

      <ItemRail
        href="/compartilhar"
        icone="enviar"
        rotulo="Compartilhar resumo diário"
        ativo={pathname.startsWith("/compartilhar")}
      />
      <ItemRail href="/fontes" icone="organizar" rotulo="Organizar fontes" ativo={pathname.startsWith("/fontes")} />
      <ThemeToggle className={classeIconeRail} />
      <button
        type="button"
        onClick={onAlternarPainel}
        aria-label={painelAberto ? "Recolher feeds" : "Mostrar feeds"}
        data-dica={painelAberto ? "Recolher feeds" : "Mostrar feeds"}
        className={`${classeIconeRail} ${painelAberto ? "" : "text-accent"}`}
      >
        <Icon nome="painel" tamanho={24} />
      </button>

      <div className="mt-2">
        <Menu
          largura="w-64"
          rotulo="Sua conta"
          classeGatilho="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-fuchsia-500 text-sm font-bold text-white ring-2 ring-transparent transition hover:ring-accent/50"
          gatilho={inicial}
        >
          {(fechar) => (
            <>
              <div className="truncate px-3 py-2 text-xs text-text-muted">{email}</div>
              <SeparadorMenu />
              <LinkMenu href="/fontes" fechar={fechar}>
                Organizar fontes
              </LinkMenu>
              <LinkMenu href="/compartilhar" fechar={fechar}>
                Compartilhar resumo diário
              </LinkMenu>
              <SeparadorMenu />
              <ItemMenu icone="sair" onClick={sair}>
                Sair
              </ItemMenu>
            </>
          )}
        </Menu>
      </div>
    </nav>
  );
}

function ItemRail({
  href,
  icone,
  rotulo,
  ativo,
}: {
  href: string;
  icone: NomeIcone;
  rotulo: string;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      data-dica={rotulo}
      aria-current={ativo ? "page" : undefined}
      className={`${classeIconeRail} ${ativo ? "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent" : ""}`}
    >
      {ativo && (
        <span className="animate-aparece absolute top-1/2 -left-[14px] h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      <Icon
        nome={icone}
        tamanho={24}
        preenchido={ativo && icone === "marcador"}
        className="transition-transform duration-150 group-hover:scale-110"
      />
    </Link>
  );
}

/* Painel de feeds (coleções e fontes) */

export function PainelFeeds({ dados, onRecolher }: { dados: DadosSidebar; onRecolher: () => void }) {
  const pathname = usePathname();
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

  const colecoesMenu = dados.colecoes.map((c) => ({ id: c.id, nome: c.nome }));
  const favoritas = dados.colecoes.flatMap((c) => c.fontes).filter((f) => f.favorita);

  return (
    <aside className="flex h-full w-[264px] flex-col overflow-y-auto border-r border-border bg-sidebar px-3 pb-6 text-[13px]">
      <div className="flex h-[72px] flex-shrink-0 items-center justify-between pl-2">
        <span className="text-[15px] font-bold tracking-tight text-foreground">Feeds</span>
        <button
          type="button"
          onClick={onRecolher}
          title="Recolher feeds"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Icon nome="chevronEsquerda" tamanho={18} />
        </button>
      </div>

      <Link
        href="/feeds/todos"
        className={`flex items-center gap-3 rounded-lg py-2 pl-2 transition-colors ${
          pathname === "/feeds/todos" ? "bg-surface-active text-foreground" : "text-foreground hover:bg-surface-hover"
        }`}
      >
        <Icon nome="camadas" tamanho={18} className="text-text-secondary" />
        <span className="flex-grow font-semibold">Todos</span>
        <Contador valor={dados.totalNaoLidos} destaque />
      </Link>

      {favoritas.length > 0 && (
        <>
          <TituloSecao>Favoritos</TituloSecao>
          <div className="flex flex-col gap-0.5">
            {favoritas.map((fonte) => (
              <LinhaFonte key={fonte.id} fonte={fonte} recuo={false} pathname={pathname} colecoes={colecoesMenu} />
            ))}
          </div>
        </>
      )}

      <TituloSecao>Coleções</TituloSecao>
      <div className="flex flex-col gap-0.5">
        {dados.colecoes.map((colecao) => {
          const aberta = !fechadas.has(colecao.id);
          const href = `/feeds/colecao/${colecao.id}`;
          const ativa = pathname === href;
          return (
            <div key={colecao.id} className="flex flex-col gap-0.5">
              <div
                className={`group relative flex items-center rounded-lg transition-colors ${
                  ativa ? "bg-surface-active" : "hover:bg-surface-hover"
                }`}
              >
                <button
                  type="button"
                  onClick={() => alternarColecao(colecao.id)}
                  aria-label={aberta ? "Recolher coleção" : "Expandir coleção"}
                  className="flex h-9 w-8 flex-shrink-0 items-center justify-center text-text-muted hover:text-foreground"
                >
                  <Icon
                    nome="chevronBaixo"
                    tamanho={15}
                    className={`transition-transform duration-200 ${aberta ? "" : "-rotate-90"}`}
                  />
                </button>
                <Link href={href} className="min-w-0 flex-grow truncate py-2 font-semibold text-foreground">
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
                      <ItensMenuColecao colecao={{ id: colecao.id, nome: colecao.nome }} fechar={fechar} naPagina={ativa} />
                    )}
                  </Menu>
                  <Link href={`/explorar?colecao=${colecao.id}`} title="Adicionar fonte nesta coleção" className={classeAcaoLinha}>
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
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {colecao.fontes.map((fonte) => (
                    <LinhaFonte key={fonte.id} fonte={fonte} recuo pathname={pathname} colecoes={colecoesMenu} />
                  ))}
                  {colecao.fontes.length === 0 && (
                    <div className="py-1.5 pl-9 text-xs text-text-muted">Coleção vazia</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <Link
          href="/explorar"
          className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-accent transition-colors hover:bg-accent-soft"
        >
          <Icon nome="adicionar" tamanho={16} />
          {dados.colecoes.length === 0 ? "Seguir suas primeiras fontes" : "Seguir mais fontes"}
        </Link>
      </div>
    </aside>
  );
}

const classeAcaoLinha =
  "flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-active hover:text-foreground";

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-1.5 px-2 text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
      {children}
    </div>
  );
}

function Contador({ valor, destaque = false }: { valor: number; destaque?: boolean }) {
  if (valor <= 0) return <span className="w-10 flex-shrink-0" />;
  return (
    <span className="flex w-10 flex-shrink-0 justify-end pr-2">
      <span
        className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
          destaque ? "bg-accent-soft font-semibold text-accent" : "text-text-muted"
        }`}
      >
        {valor}
      </span>
    </span>
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
      className={`group relative flex items-center rounded-lg transition-colors ${
        ativa ? "bg-surface-active" : "hover:bg-surface-hover"
      }`}
    >
      <Link
        href={href}
        className={`flex min-w-0 flex-grow items-center gap-2.5 py-2 ${recuo ? "pl-8" : "pl-2"} ${
          fonte.naoLidos === 0 ? "text-text-secondary" : "text-foreground"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faviconDe(fonte.host)} alt="" className="h-[18px] w-[18px] flex-shrink-0 rounded" />
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

function LinkMenu({ href, fechar, children }: { href: string; fechar: () => void; children: React.ReactNode }) {
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
