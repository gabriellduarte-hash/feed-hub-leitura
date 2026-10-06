"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArtigoLista } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
import { ResumoFormatado } from "@/lib/resumo";
import { Icon, type NomeIcone } from "./Icon";
import { ItemMenu, Menu } from "./Menu";
import { mostrarToast } from "./Toast";

type Estado = { lido: boolean; salvo: boolean };

type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "h"; texto: string }
  | { tipo: "lista"; itens: string[] };

/** O texto coletado vem "chapado" (uma linha por parágrafo). Aqui ele
 * vira blocos: linha curta sem pontuação final = intertítulo, linhas
 * começando com "-", "•" ou "*" = lista, o resto = parágrafo. */
function formatar(texto: string): Bloco[] {
  const linhas = texto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const blocos: Bloco[] = [];
  linhas.forEach((linha, i) => {
    const item = linha.match(/^[-•*]\s+(.*)$/);
    if (item) {
      const ultimo = blocos.at(-1);
      if (ultimo?.tipo === "lista") ultimo.itens.push(item[1]);
      else blocos.push({ tipo: "lista", itens: [item[1]] });
      return;
    }
    const pareceTitulo =
      linha.length < 90 &&
      linha.split(/\s+/).length >= 2 &&
      !/[.!?:;,…"”)]$/.test(linha) &&
      i < linhas.length - 1;
    blocos.push({ tipo: pareceTitulo ? "h" : "p", texto: linha });
  });
  return blocos;
}

function minutosDeLeitura(a: ArtigoLista) {
  const palavras = `${a.ai_summary ?? ""} ${a.content ?? ""}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

/** Leitor de artigo: abre no centro do espaço à direita do menu lateral
 * (que continua visível), com zoom suave. Usa --largura-menu do AppShell. */
export function ArticlePanel({
  artigo: a,
  estado: e,
  saindo,
  temAnterior,
  temProximo,
  onFechar,
  onSaiu,
  onNavegar,
  onAlterar,
}: {
  artigo: ArtigoLista;
  estado: Estado;
  saindo: boolean;
  temAnterior: boolean;
  temProximo: boolean;
  onFechar: () => void;
  onSaiu: () => void;
  onNavegar: (delta: number) => void;
  onAlterar: (m: Partial<Estado>) => void;
}) {
  // Guarda de qual artigo é o progresso: ao navegar (j/k) volta a zero
  const [rolagem, setRolagem] = useState({ id: a.id, valor: 0 });
  const progresso = rolagem.id === a.id ? rolagem.valor : 0;

  async function copiarLink() {
    await navigator.clipboard.writeText(a.url);
    mostrarToast("Link copiado");
  }

  const blocos = formatar(a.content ?? "");
  const temTexto = blocos.length > 0 && a.content !== a.ai_summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:left-[var(--largura-menu)] md:p-5 lg:p-6">
      <div
        onClick={onFechar}
        className={`absolute inset-0 bg-overlay ${saindo ? "animate-some" : "animate-aparece"}`}
      />

      <div
        role="dialog"
        aria-modal
        aria-label={a.title}
        onAnimationEnd={(ev) => {
          if (saindo && ev.target === ev.currentTarget) onSaiu();
        }}
        className={`relative flex h-full w-full max-w-[1280px] flex-col overflow-hidden bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] md:rounded-lg md:border md:border-border ${
          saindo ? "animate-painel-sai" : "animate-painel-entra"
        }`}
      >
        <header className="relative flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-border px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BotaoBarra icone="fechar" rotulo="Fechar (Esc)" onClick={onFechar} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faviconDe(a.fonteHost)} alt="" className="h-5 w-5 flex-shrink-0 rounded-sm" />
            <span className="truncate text-[13px] font-semibold text-foreground">{a.fonteNome}</span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            {a.origem === "catalogo" ? (
              <Link
                href={`/explorar?q=${encodeURIComponent(a.fonteNome)}`}
                className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
              >
                <Icon nome="adicionar" tamanho={15} />
                Seguir
              </Link>
            ) : (
              <>
                <BotaoBarra
                  icone="marcador"
                  rotulo={e.salvo ? "Remover de Ler mais tarde (s)" : "Ler mais tarde (s)"}
                  ativo={e.salvo}
                  onClick={() => onAlterar({ salvo: !e.salvo })}
                />
                <BotaoBarra
                  icone="check"
                  rotulo={e.lido ? "Marcar como não lido (m)" : "Marcar como lido (m)"}
                  ativo={e.lido}
                  onClick={() => onAlterar({ lido: !e.lido })}
                />
              </>
            )}
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="group ml-1 flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[12px] font-semibold text-background transition-colors duration-150 hover:bg-accent active:scale-[0.97]"
            >
              <span className="hidden sm:inline">Abrir original</span>
              <Icon
                nome="externo"
                tamanho={13}
                className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
            <Menu
              alinhar="direita"
              rotulo="Mais opções"
              gatilho={<Icon nome="mais" tamanho={18} />}
              classeGatilho="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              {(fechar) => (
                <>
                  <ItemMenu
                    icone="link"
                    onClick={() => {
                      copiarLink();
                      fechar();
                    }}
                  >
                    Copiar link
                  </ItemMenu>
                  <ItemMenu
                    icone="email"
                    onClick={() => {
                      window.location.href = `mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(a.url)}`;
                      fechar();
                    }}
                  >
                    Enviar por e-mail
                  </ItemMenu>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <ItemMenu
                      icone="compartilhar"
                      onClick={() => {
                        navigator.share({ title: a.title, url: a.url }).catch(() => {});
                        fechar();
                      }}
                    >
                      Compartilhar…
                    </ItemMenu>
                  )}
                </>
              )}
            </Menu>
          </div>

          <div
            className="absolute inset-x-0 -bottom-px h-[2px] origin-left bg-accent transition-transform duration-100"
            style={{ transform: `scaleX(${progresso})` }}
          />
        </header>

        {/* setas nas margens do leitor (só em tela larga, onde sobra espaço ao lado do texto) */}
        {temAnterior && <SetaNavegacao lado="esquerda" onClick={() => onNavegar(-1)} />}
        {temProximo && <SetaNavegacao lado="direita" onClick={() => onNavegar(1)} />}

        <div
          key={a.id}
          onScroll={(ev) => {
            const el = ev.currentTarget;
            const total = el.scrollHeight - el.clientHeight;
            setRolagem({ id: a.id, valor: total > 0 ? el.scrollTop / total : 1 });
          }}
          className="relative flex-grow overflow-y-auto"
        >
          {a.image_url && (
            <figure className="animate-fade-up mx-auto max-w-[960px] md:px-10 md:pt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.image_url}
                alt=""
                className="aspect-[16/9] w-full bg-surface-active object-cover md:aspect-[21/9] md:rounded-md"
              />
            </figure>
          )}
          <article className={`animate-fade-up mx-auto max-w-[720px] px-5 pb-20 sm:px-8 md:px-10 ${a.image_url ? "pt-8 md:pt-10" : "pt-10 md:pt-14"}`}>
            <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
              {a.category && <span className="text-accent">{a.category}</span>}
              {a.category && <span aria-hidden>/</span>}
              <span>{minutosDeLeitura(a)} min de leitura</span>
            </div>

            <h1 className="mt-4 text-[24px] leading-[1.15] font-extrabold tracking-tight text-balance text-foreground sm:text-[30px] lg:text-[34px]">
              {a.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-[13px]">
              <span className="font-semibold text-foreground">{a.author ?? a.fonteNome}</span>
              <span className="font-light text-text-muted">{a.dataCompleta}</span>
            </div>

            {a.ai_summary && (
              <section className="mt-10">
                <h2 className="mb-5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                  <Icon nome="ia" tamanho={14} className="text-accent" />
                  Resumo
                </h2>
                <ResumoFormatado texto={a.ai_summary} />
              </section>
            )}

            {temTexto && (
              <section className="mt-12 border-t border-border pt-10">
                <h2 className="mb-6 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                  {a.ai_summary ? "Texto da matéria" : "A notícia"}
                </h2>
                <div className="flex flex-col gap-6 font-[family-name:var(--fonte-leitura)] text-[length:var(--tamanho-leitura)] leading-[1.9] text-text-secondary">
                  {blocos.map((b, i) =>
                    b.tipo === "h" ? (
                      <h3 key={i} className="mt-3 text-[1.1em] leading-snug font-bold text-foreground">
                        {b.texto}
                      </h3>
                    ) : b.tipo === "lista" ? (
                      <ul key={i} className="flex flex-col gap-2">
                        {b.itens.map((item, j) => (
                          <li key={j} className="flex gap-3">
                            <span className="text-accent">—</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={i}>{b.texto}</p>
                    ),
                  )}
                </div>
              </section>
            )}

            {!a.ai_summary && !temTexto && (
              <p className="mt-10 text-[14px] text-text-secondary">
                O texto completo desta notícia está no site.
              </p>
            )}

            <div className="mt-14 flex flex-col items-start gap-3 border-t border-border pt-8">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 text-[14px] font-bold text-foreground transition-colors hover:text-accent"
              >
                Continuar em {a.fonteHost}
                <Icon
                  nome="externo"
                  tamanho={14}
                  className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function BotaoBarra({
  icone,
  rotulo,
  onClick,
  ativo = false,
}: {
  icone: NomeIcone;
  rotulo: string;
  onClick: () => void;
  ativo?: boolean;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition duration-150 hover:bg-surface-hover active:scale-90 ${
        ativo ? "text-accent" : "text-text-secondary hover:text-foreground"
      }`}
    >
      <Icon nome={icone} tamanho={17} preenchido={ativo && icone === "marcador"} />
    </button>
  );
}

function SetaNavegacao({ lado, onClick }: { lado: "esquerda" | "direita"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={lado === "direita" ? "Próximo (j)" : "Anterior (k)"}
      className={`absolute top-1/2 z-10 hidden h-11 w-9 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors hover:border-accent hover:text-accent xl:flex ${
        lado === "direita" ? "right-3" : "left-3"
      }`}
    >
      <Icon nome={lado === "direita" ? "chevronDireita" : "chevronEsquerda"} tamanho={18} />
    </button>
  );
}
