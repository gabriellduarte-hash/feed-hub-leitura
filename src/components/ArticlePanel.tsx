"use client";

import type { ArtigoLista } from "@/lib/feed";
import { Icon, type NomeIcone } from "./Icon";
import { ItemMenu, Menu } from "./Menu";
import { mostrarToast } from "./Toast";

type Estado = { lido: boolean; salvo: boolean };

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
  async function copiarLink() {
    await navigator.clipboard.writeText(a.url);
    mostrarToast("Copiado para a área de transferência");
  }

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, url: a.url });
      } catch {
        // usuário cancelou o diálogo nativo
      }
    } else {
      await copiarLink();
    }
  }

  const paragrafos = (a.content ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50">
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
        className={`absolute top-0 right-0 bottom-0 flex w-full flex-col bg-surface shadow-2xl md:w-[min(1180px,calc(100vw-240px))] ${
          saindo ? "animate-painel-sai" : "animate-painel-entra"
        }`}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-4">
          <BotaoBarra icone="fechar" rotulo="Fechar (Esc)" onClick={onFechar} />
          <div className="flex items-center gap-1">
            <a
              href={`mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(a.url)}`}
              title="Enviar por e-mail"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
            >
              <Icon nome="email" />
            </a>
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
            <BotaoBarra icone="link" rotulo="Copiar link" onClick={copiarLink} />
            <button
              type="button"
              onClick={compartilhar}
              className="ml-1 flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.97]"
            >
              <Icon nome="compartilhar" tamanho={16} />
              Compartilhar
            </button>
            <Menu
              alinhar="direita"
              rotulo="Mais opções"
              gatilho={<Icon nome="mais" />}
              classeGatilho="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
            >
              {(fechar) => (
                <>
                  <ItemMenu
                    icone="externo"
                    onClick={() => {
                      window.open(a.url, "_blank", "noopener");
                      fechar();
                    }}
                  >
                    Abrir original (v)
                  </ItemMenu>
                  <ItemMenu
                    icone="check"
                    onClick={() => {
                      onAlterar({ lido: !e.lido });
                      fechar();
                    }}
                  >
                    {e.lido ? "Marcar como não lido" : "Marcar como lido"}
                  </ItemMenu>
                </>
              )}
            </Menu>
          </div>
        </div>

        <div key={a.id} className="relative flex-grow overflow-y-auto">
          <article className="animate-fade-up mx-auto flex max-w-[720px] flex-col gap-7 px-8 pt-12 pb-16">
            <header className="flex flex-col gap-2">
              <h1 className="text-[30px] leading-[1.2] font-bold text-foreground">{a.title}</h1>
              <div className="flex flex-col gap-0.5 text-[13px] text-text-muted">
                {a.category && (
                  <span className="flex items-center gap-1 text-accent">
                    <Icon nome="tendencia" tamanho={14} />
                    {a.category}
                  </span>
                )}
                <span>
                  {a.fonteNome}
                  {a.author ? ` por ${a.author}` : ""} / {a.dataCompleta}
                </span>
              </div>
            </header>

            {a.ai_summary && (
              <div className="flex gap-3">
                <Icon nome="ia" tamanho={18} className="mt-0.5 flex-shrink-0 text-accent" />
                <div className="flex flex-col gap-2 border-l-2 border-accent/50 pl-4">
                  <div className="text-sm font-semibold text-foreground">Resumo por IA</div>
                  <p className="text-[15px] leading-relaxed text-foreground">{a.ai_summary}</p>
                </div>
              </div>
            )}

            {a.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image_url}
                alt=""
                className="w-full rounded-sm border border-border object-cover"
              />
            )}

            {paragrafos.length > 0 && (
              <div className="flex flex-col gap-4 font-serif text-[18px] leading-[1.75] text-foreground/90">
                {paragrafos.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="group mt-2 flex items-center justify-center gap-2 rounded-md border border-border py-3 text-[17px] text-foreground transition hover:border-text-muted hover:bg-surface-hover"
            >
              Visitar site original
              <Icon
                nome="externo"
                tamanho={16}
                className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            <p className="text-center text-xs text-text-muted">
              Atalhos: <b>j</b>/<b>k</b> próximo/anterior · <b>m</b> lido · <b>s</b> ler mais tarde ·{" "}
              <b>v</b> abrir original · <b>Esc</b> fechar
            </p>
          </article>

          {temAnterior && (
            <SetaNavegacao lado="esquerda" onClick={() => onNavegar(-1)} />
          )}
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
      className={`flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-surface-hover active:scale-90 ${
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
      className={`fixed top-1/2 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-hover hover:text-foreground ${
        lado === "direita" ? "right-3" : "left-3"
      }`}
    >
      <Icon nome={lado === "direita" ? "chevronDireita" : "chevronEsquerda"} tamanho={22} />
    </button>
  );
}
