"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { criarColecao } from "@/app/actions/fontes";
import { marcarTudoComoLido } from "@/app/actions/artigos";
import { createClient } from "@/lib/supabase/client";
import { faviconDe } from "@/lib/fonte";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { Icon, type NomeIcone } from "./Icon";
import { ItemMenu, Menu, SeparadorMenu } from "./Menu";
import { ItensMenuColecao, ItensMenuFonte } from "./MenusFonte";
import { abrirConfiguracoes, estiloAvatar } from "./Configuracoes";
import { mostrarToast } from "./Toast";

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

export type Perfil = { nome: string; sobrenome: string; cor: string };

export type DadosSidebar = {
  colecoes: ColecaoSidebar[];
  totalNaoLidos: number;
  email: string;
  perfil: Perfil;
};

/* Item do menu: ícone grande + nome (aberto) ou só o ícone com dica (recolhido). */
const classeItem =
  "group relative flex h-9 flex-shrink-0 items-center gap-3 rounded-md px-[11px] text-[13px] transition-colors duration-150";

function classeEstado(ativo: boolean) {
  return ativo
    ? "bg-surface-active font-semibold text-foreground"
    : "text-text-secondary hover:bg-surface-hover hover:text-foreground";
}

export function Sidebar({
  dados,
  recolhido,
  onAlternar,
  onIrPara,
}: {
  dados: DadosSidebar;
  recolhido: boolean;
  onAlternar: () => void;
  onIrPara: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nome = [dados.perfil.nome, dados.perfil.sobrenome].filter(Boolean).join(" ") || dados.email.split("@")[0];

  return (
    <nav
      className={`relative z-40 flex h-full flex-shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 transition-[width] duration-[250ms] ease-out [&>*]:flex-shrink-0 ${
        // aberto: rola se a lista de coleções for longa; recolhido: sem
        // rolagem, pra dica (tooltip) poder sair pra fora do menu
        recolhido ? "w-[72px] overflow-visible" : "w-[264px] overflow-x-hidden overflow-y-auto"
      }`}
    >
      <div className={`mb-7 flex items-center ${recolhido ? "flex-col gap-3" : "justify-between"}`}>
        <Link href="/" aria-label="Início" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-colors duration-200 hover:bg-accent">
            <Icon nome="rss" tamanho={20} espessura={2.2} />
          </span>
          {!recolhido && (
            <span className="animate-aparece truncate text-[14px] font-extrabold tracking-tight text-foreground">
              Feed de Notícias
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onAlternar}
          aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
          data-dica={recolhido ? "Expandir menu" : undefined}
          className={`${recolhido ? "dica" : ""} flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-foreground`}
        >
          <Icon nome={recolhido ? "chevronDireita" : "chevronEsquerda"} tamanho={18} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <ItemNav href="/" icone="casa" rotulo="Início" recolhido={recolhido} ativo={pathname === "/"} />
        {recolhido && (
          <ItemNav
            href="/feeds/todos"
            icone="camadas"
            rotulo="Todos os feeds"
            recolhido
            ativo={pathname.startsWith("/feeds")}
          />
        )}
        <ItemNav
          href="/ler-mais-tarde"
          icone="marcador"
          rotulo="Ler mais tarde"
          recolhido={recolhido}
          ativo={pathname.startsWith("/ler-mais-tarde")}
        />
        <ItemNav
          href="/lidos-recentemente"
          icone="relogio"
          rotulo="Lidos recentemente"
          recolhido={recolhido}
          ativo={pathname.startsWith("/lidos-recentemente")}
        />
        <ItemNav href="/buscar" icone="buscar" rotulo="Buscar" recolhido={recolhido} ativo={pathname.startsWith("/buscar")} />
        <button
          type="button"
          onClick={onIrPara}
          aria-label="Ir para"
          data-dica={recolhido ? "Ir para…  Ctrl K" : undefined}
          className={`${classeItem} ${classeEstado(false)} ${recolhido ? "dica" : ""}`}
        >
          <Icon nome="comando" tamanho={18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
          {!recolhido && (
            <>
              <span className="truncate">Ir para…</span>
              <kbd className="ml-auto rounded border border-border px-1.5 text-[10px] text-text-muted">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      <Link
        href="/explorar"
        aria-label="Seguir fontes"
        data-dica={recolhido ? "Seguir fontes" : undefined}
        className={`${recolhido ? "dica" : ""} group mt-6 flex h-9 items-center gap-3 rounded-md border px-[10px] text-[13px] font-semibold transition-colors duration-150 active:scale-[0.98] ${
          pathname.startsWith("/explorar")
            ? "border-accent bg-accent-soft text-accent"
            : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        <Icon nome="adicionar" tamanho={18} espessura={2} className="flex-shrink-0 text-accent transition-transform duration-200 group-hover:rotate-90" />
        {!recolhido && <span className="truncate">Seguir fontes</span>}
      </Link>

      {!recolhido && <SubmenuColecoes dados={dados} pathname={pathname} />}

      <div className="mt-auto flex flex-col gap-1 pt-8">
        <button
          type="button"
          onClick={() => abrirConfiguracoes("resumo")}
          aria-label="Resumo diário"
          data-dica={recolhido ? "Resumo diário" : undefined}
          className={`${classeItem} ${classeEstado(false)} ${recolhido ? "dica" : ""}`}
        >
          <Icon nome="enviar" tamanho={18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
          {!recolhido && <span className="truncate">Resumo diário</span>}
        </button>
        <div className="mt-2">
          <Menu
            largura="w-64"
            rotulo="Sua conta"
            classeGatilho={`flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-surface-hover ${
              recolhido ? "justify-center" : ""
            }`}
            gatilho={
              <>
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={estiloAvatar(dados.perfil.cor)}
                >
                  {(nome.charAt(0) || "?").toUpperCase()}
                </span>
                {!recolhido && (
                  <>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-foreground">{nome}</span>
                      <span className="truncate text-[11px] text-text-muted">{dados.email}</span>
                    </span>
                    <Icon nome="chevronBaixo" tamanho={16} className="ml-auto flex-shrink-0 text-text-muted" />
                  </>
                )}
              </>
            }
          >
            {(fechar) => (
              <>
                <div className="flex flex-col px-3 py-2">
                  <span className="truncate text-sm font-semibold text-foreground">{nome}</span>
                  <span className="truncate text-xs text-text-muted">{dados.email}</span>
                </div>
                <SeparadorMenu />
                <ItemMenu
                  icone="lapis"
                  onClick={() => {
                    fechar();
                    abrirConfiguracoes("perfil");
                  }}
                >
                  Editar perfil
                </ItemMenu>
                <ItemMenu
                  icone="organizar"
                  onClick={() => {
                    fechar();
                    abrirConfiguracoes("geral");
                  }}
                >
                  Configurações
                </ItemMenu>
                <ItemMenu
                  icone="sol"
                  onClick={() => {
                    fechar();
                    abrirConfiguracoes("aparencia");
                  }}
                >
                  Aparência e tema
                </ItemMenu>
                <SeparadorMenu />
                <ItemMenu icone="sair" onClick={sair}>
                  Sair
                </ItemMenu>
              </>
            )}
          </Menu>
        </div>
      </div>
    </nav>
  );
}

function ItemNav({
  href,
  icone,
  rotulo,
  ativo,
  recolhido,
}: {
  href: string;
  icone: NomeIcone;
  rotulo: string;
  ativo: boolean;
  recolhido: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      data-dica={recolhido ? rotulo : undefined}
      aria-current={ativo ? "page" : undefined}
      className={`${classeItem} ${classeEstado(ativo)} ${recolhido ? "dica" : ""}`}
    >
      {ativo && (
        <span className="animate-aparece absolute top-1/2 -left-4 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      <Icon
        nome={icone}
        tamanho={18}
        preenchido={ativo && icone === "marcador"}
        className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
      />
      {!recolhido && <span className="truncate">{rotulo}</span>}
    </Link>
  );
}

/* Submenu das coleções (só com o menu aberto) */

function SubmenuColecoes({ dados, pathname }: { dados: DadosSidebar; pathname: string }) {
  const [submenuAberto, setSubmenuAberto] = useLocalStorage("submenu-colecoes", "1");
  const [fechadasJson, setFechadasJson] = useLocalStorage("colecoes-fechadas", "[]");
  const [, startTransition] = useTransition();
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

  function novaColecao() {
    const nome = window.prompt("Nome da nova coleção");
    if (!nome?.trim()) return;
    startTransition(async () => {
      const resultado = await criarColecao(nome);
      mostrarToast(resultado?.erro ?? `Coleção ${nome.trim()} criada`);
    });
  }

  function marcarTodasLidas() {
    if (!window.confirm("Marcar todos os artigos de todas as coleções como lidos?")) return;
    startTransition(async () => {
      await marcarTudoComoLido({ tipo: "todos" });
      mostrarToast("Tudo marcado como lido");
    });
  }

  const aberto = submenuAberto === "1";
  const todasFechadas = dados.colecoes.length > 0 && dados.colecoes.every((c) => fechadas.has(c.id));
  const colecoesMenu = dados.colecoes.map((c) => ({ id: c.id, nome: c.nome }));
  const favoritas = dados.colecoes.flatMap((c) => c.fontes).filter((f) => f.favorita);

  return (
    <div className="animate-aparece mt-9 flex flex-col text-[13px]">
      <div className="group mb-2 flex h-8 items-center rounded-md">
        <button
          type="button"
          onClick={() => setSubmenuAberto(aberto ? "0" : "1")}
          aria-expanded={aberto}
          className="flex h-8 min-w-0 flex-grow items-center gap-2 px-1 text-[12px] font-medium text-text-muted transition-colors hover:text-foreground"
        >
          <Icon
            nome="chevronBaixo"
            tamanho={14}
            className={`transition-transform duration-200 ${aberto ? "" : "-rotate-90"}`}
          />
          Coleções
        </button>
        <div className="opacity-0 transition-opacity group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          <Menu
            rotulo="Opções das coleções"
            gatilho={<Icon nome="mais" tamanho={16} />}
            classeGatilho={classeAcaoLinha}
          >
            {(fechar) => (
              <>
                <ItemMenu
                  icone="lista"
                  onClick={() => {
                    fechar();
                    novaColecao();
                  }}
                >
                  Nova coleção
                </ItemMenu>
                <LinkMenu href="/fontes" fechar={fechar} icone="organizar">
                  Organizar fontes
                </LinkMenu>
                <ItemMenu
                  icone="check"
                  onClick={() => {
                    fechar();
                    marcarTodasLidas();
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
        <Contador valor={dados.totalNaoLidos} destaque />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="flex flex-col gap-1 overflow-hidden">
          <Link
            href="/feeds/todos"
            className={`flex items-center gap-3 rounded-md py-[7px] pl-2 transition-colors ${
              pathname === "/feeds/todos" ? "bg-surface-active text-foreground" : "text-foreground hover:bg-surface-hover"
            }`}
          >
            <Icon nome="camadas" tamanho={18} className="text-text-secondary" />
            <span className="flex-grow font-semibold">Todos</span>
            <Contador valor={dados.totalNaoLidos} />
          </Link>

          {favoritas.length > 0 && (
            <>
              <div className="mt-3 mb-1 px-2 text-[11px] font-medium text-text-muted">
                Favoritos
              </div>
              {favoritas.map((fonte) => (
                <LinhaFonte key={`fav-${fonte.id}`} fonte={fonte} recuo={false} pathname={pathname} colecoes={colecoesMenu} />
              ))}
              <div className="mt-2" />
            </>
          )}

          {dados.colecoes.map((colecao) => {
            const colecaoAberta = !fechadas.has(colecao.id);
            const href = `/feeds/colecao/${colecao.id}`;
            const ativa = pathname === href;
            return (
              <div key={colecao.id} className="flex flex-col gap-1">
                <div
                  className={`group relative flex items-center rounded-md transition-colors ${
                    ativa ? "bg-surface-active" : "hover:bg-surface-hover"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternarColecao(colecao.id)}
                    aria-label={colecaoAberta ? "Recolher coleção" : "Expandir coleção"}
                    className="flex h-9 w-8 flex-shrink-0 items-center justify-center text-text-muted hover:text-foreground"
                  >
                    <Icon
                      nome="chevronBaixo"
                      tamanho={15}
                      className={`transition-transform duration-200 ${colecaoAberta ? "" : "-rotate-90"}`}
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
                    colecaoAberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
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

          <Menu
            rotulo="Adicionar fonte"
            largura="w-64"
            classeGatilho="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-accent transition-colors hover:bg-accent-soft"
            gatilho={
              <>
                <Icon nome="adicionar" tamanho={16} />
                Adicionar fonte
              </>
            }
          >
            {(fechar) => (
              <>
                <LinkMenu href="/explorar" fechar={fechar} icone="rss">
                  Escolher no catálogo
                </LinkMenu>
                <LinkMenu href="/explorar?aba=url" fechar={fechar} icone="link">
                  Colar o endereço de um site
                </LinkMenu>
              </>
            )}
          </Menu>
        </div>
      </div>
    </div>
  );
}

const classeAcaoLinha =
  "flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-active hover:text-foreground";

function Contador({ valor, destaque = false }: { valor: number; destaque?: boolean }) {
  if (valor <= 0) return <span className="ml-auto w-10 flex-shrink-0" />;
  return (
    <span className="ml-auto flex w-10 flex-shrink-0 justify-end pr-2">
      <span
        className={`rounded-md px-1.5 py-0.5 text-[11px] tracking-normal tabular-nums normal-case ${
          destaque ? "font-bold text-accent" : "text-text-muted"
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
      className={`group relative flex items-center rounded-md transition-colors ${
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

function LinkMenu({
  href,
  fechar,
  icone,
  children,
}: {
  href: string;
  fechar: () => void;
  icone?: NomeIcone;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={fechar}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
    >
      {icone && <Icon nome={icone} tamanho={16} className="text-text-secondary" />}
      {children}
    </Link>
  );
}
