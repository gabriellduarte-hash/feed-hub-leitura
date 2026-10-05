"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArtigoLista } from "@/lib/feed";
import { faviconDe } from "@/lib/fonte";
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
    <div className="fixed inset-0 z-50">
      <div
        onClick={onFechar}
        className={`absolute inset-0 bg-overlay backdrop-blur-[2px] ${saindo ? "animate-some" : "animate-aparece"}`}
      />

      <div
        role="dialog"
        aria-modal
        aria-label={a.title}
        onAnimationEnd={(ev) => {
          if (saindo && ev.target === ev.currentTarget) onSaiu();
        }}
        className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-border bg-surface shadow-2xl md:inset-y-3 md:right-3 md:w-[min(1040px,calc(100vw-110px))] md:rounded-2xl md:border ${
          saindo ? "animate-painel-sai" : "animate-painel-entra"
        }`}
      >
        <header className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
          <button
            type="button"
            onClick={onFechar}
            title="Fechar (Esc)"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover text-foreground transition hover:bg-surface-active active:scale-90"
          >
            <Icon nome="fechar" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconDe(a.fonteHost)}
            alt={a.fonteNome}
            title={a.fonteNome}
            className="absolute left-1/2 h-9 w-9 -translate-x-1/2 rounded-xl bg-surface-hover p-1.5 ring-1 ring-border"
          />

          <div className="flex items-center gap-1">
            {a.origem === "catalogo" ? (
              <Link
                href={`/explorar?q=${encodeURIComponent(a.fonteNome)}`}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
              >
                <Icon nome="adicionar" tamanho={16} />
                Seguir {a.fonteNome}
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
              className="ml-2 flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.97]"
            >
              Abrir original
              <Icon nome="externo" tamanho={15} />
            </a>
            <Menu
              alinhar="direita"
              rotulo="Mais opções"
              gatilho={<Icon nome="mais" />}
              classeGatilho="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover text-foreground transition hover:bg-surface-active"
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
            className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent transition-transform duration-100"
            style={{ transform: `scaleX(${progresso})` }}
          />
        </header>

        <div
          key={a.id}
          onScroll={(ev) => {
            const el = ev.currentTarget;
            const total = el.scrollHeight - el.clientHeight;
            setRolagem({ id: a.id, valor: total > 0 ? el.scrollTop / total : 1 });
          }}
          className="relative flex-grow overflow-y-auto"
        >
          <article className="animate-fade-up mx-auto max-w-[680px] px-8 pt-14 pb-20">
            <div className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-text-muted uppercase">
              {a.fonteNome}
            </div>
            <h1 className="text-[32px] leading-[1.18] font-bold tracking-tight text-foreground text-balance">
              {a.title}
            </h1>
            <p className="mt-3 text-[15px] text-text-secondary">
              {a.category && <span className="text-accent">#{a.category.toLowerCase()}</span>}
              {a.category && " · "}
              {minutosDeLeitura(a)} min de leitura
            </p>

            <div className="mt-7 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconDe(a.fonteHost)}
                alt=""
                className="h-10 w-10 rounded-full bg-accent-soft p-2 ring-2 ring-accent/40"
              />
              <div className="flex flex-col text-[12px] tracking-wider uppercase">
                <span className="font-semibold text-foreground">{a.author ?? a.fonteNome}</span>
                <span className="text-text-muted">{a.dataCompleta}</span>
              </div>
            </div>

            <hr className="my-9 border-border" />

            {a.ai_summary && (
              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 text-[22px] font-bold tracking-tight text-foreground">
                  <Icon nome="ia" tamanho={20} className="text-accent" />
                  Resumo
                </h2>
                <p className="rounded-r-xl border-l-[3px] border-accent bg-accent-soft/60 py-4 pr-5 pl-5 text-[16px] leading-[1.85] text-foreground">
                  {a.ai_summary}
                </p>
              </section>
            )}

            {a.image_url && (
              <figure className="mb-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image_url} alt="" className="w-full rounded-xl ring-1 ring-border" />
                <figcaption className="mt-2 text-center text-[12px] text-text-muted">Imagem: {a.fonteNome}</figcaption>
              </figure>
            )}

            {temTexto && (
              <section>
                <h2 className="mb-5 text-[22px] font-bold tracking-tight text-foreground">A notícia</h2>
                <div className="flex flex-col gap-6 text-[16px] leading-[1.9] text-foreground/90">
                  {blocos.map((b, i) =>
                    b.tipo === "h" ? (
                      <h3 key={i} className="mt-4 text-[19px] leading-snug font-bold text-foreground">
                        {b.texto}
                      </h3>
                    ) : b.tipo === "lista" ? (
                      <ul key={i} className="flex flex-col gap-2 pl-1">
                        {b.itens.map((item, j) => (
                          <li key={j} className="flex gap-3">
                            <span className="text-accent">→</span>
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

            <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-background/50 p-6">
              <div className="text-[13px] text-text-secondary">
                O texto acima é o que o coletor conseguiu extrair. A matéria completa, com links e mídia, está no site.
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98]"
              >
                Continuar em {a.fonteHost}
                <Icon
                  nome="externo"
                  tamanho={15}
                  className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>

            <p className="mt-10 text-center text-[11px] text-text-muted">
              <b>j</b>/<b>k</b> próximo/anterior · <b>m</b> lido · <b>s</b> ler mais tarde · <b>v</b> abrir original ·{" "}
              <b>Esc</b> fechar
            </p>
          </article>

          {temAnterior && <SetaNavegacao lado="esquerda" onClick={() => onNavegar(-1)} />}
          {temProximo && <SetaNavegacao lado="direita" onClick={() => onNavegar(1)} />}
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
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-hover active:scale-90 ${
        ativo ? "text-accent" : "text-text-secondary hover:text-foreground"
      }`}
    >
      <Icon nome={icone} preenchido={ativo && icone === "marcador"} />
    </button>
  );
}

function SetaNavegacao({ lado, onClick }: { lado: "esquerda" | "direita"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={lado === "direita" ? "Próximo (j)" : "Anterior (k)"}
      className={`fixed top-1/2 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-hover hover:text-foreground ${
        lado === "direita" ? "right-3" : "left-3"
      }`}
    >
      <Icon nome={lado === "direita" ? "chevronDireita" : "chevronEsquerda"} tamanho={22} />
    </button>
  );
}
