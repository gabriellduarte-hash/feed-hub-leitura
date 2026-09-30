import { salvarArtigo, removerSalvo } from "@/app/actions/saved-articles";

export type Artigo = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  ai_summary: string | null;
  category: string | null;
  published_at: string | null;
  image_url: string | null;
};

function formatarData(iso: string | null) {
  if (!iso) return "data não informada";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ArticleCard({
  artigo,
  salvo,
  path,
}: {
  artigo: Artigo;
  salvo: boolean;
  path: string;
}) {
  const resumo = artigo.ai_summary ?? artigo.content;

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface p-[18px]">
      {artigo.image_url ? (
        // <img> simples de propósito: a URL vem de fontes RSS
        // arbitrárias, e o next/image com remotePatterns liberado pra
        // qualquer domínio vira um "proxy de imagem aberto" — a própria
        // doc do Next desaconselha esse padrão.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artigo.image_url}
          alt=""
          loading="lazy"
          className="w-[168px] flex-shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <div className="flex w-[168px] flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 15l-5-5-9 9" />
          </svg>
        </div>
      )}

      <div className="flex min-w-0 flex-grow flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-base font-bold text-foreground">{artigo.title}</div>
          <form action={salvo ? removerSalvo : salvarArtigo} className="flex-shrink-0">
            <input type="hidden" name="article_id" value={artigo.id} />
            <input type="hidden" name="path" value={path} />
            <button
              type="submit"
              aria-label={salvo ? "Remover de ler mais tarde" : "Salvar pra ler mais tarde"}
              className="text-text-muted"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill={salvo ? "var(--accent)" : "none"}
                stroke={salvo ? "var(--accent)" : "currentColor"}
                strokeWidth="1.8"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </form>
        </div>
        <div className="mono text-[11px] text-text-muted">
          {artigo.author ?? "autor não informado"} · {formatarData(artigo.published_at)}
        </div>
        {resumo && (
          <div className="line-clamp-2 text-[13px] text-text-secondary">{resumo}</div>
        )}
        <a
          href={artigo.url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 text-xs font-bold text-accent"
        >
          Ler artigo completo →
        </a>
      </div>
    </div>
  );
}
