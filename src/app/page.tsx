import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Mesma ordem fixa de categorias usada em resumo/resumir.py (Python) —
// mantém as seções do feed na mesma ordem entre o e-mail e o hub.
const CATEGORIAS = [
  "Tecnologia", "Finanças", "Humor", "Política", "Ciência",
  "Saúde", "Esportes", "Entretenimento", "Mundo", "Outros",
];
const SEM_CATEGORIA = "__sem_categoria__";

type Artigo = {
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

function Card({ artigo }: { artigo: Artigo }) {
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
        <div className="text-base font-bold text-foreground">{artigo.title}</div>
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

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: topicos } = await supabase
    .from("topics")
    .select("id, name")
    .order("created_at");

  const { data: artigosData } = await supabase
    .from("articles")
    .select("id, title, url, author, content, ai_summary, category, published_at, image_url")
    .order("collected_at", { ascending: false })
    .limit(60);

  const artigos = (artigosData ?? []) as Artigo[];

  const grupos = new Map<string, Artigo[]>();
  for (const artigo of artigos) {
    const chave = artigo.category ?? SEM_CATEGORIA;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(artigo);
  }

  const secoes = [
    ...CATEGORIAS.filter((c) => grupos.has(c)).map((c) => ({
      titulo: c,
      pendente: false,
      artigos: grupos.get(c)!,
    })),
    ...(grupos.has(SEM_CATEGORIA)
      ? [{ titulo: "Aguardando resumo", pendente: true, artigos: grupos.get(SEM_CATEGORIA)! }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={topicos ?? []} />

      <div className="flex min-w-0 flex-grow flex-col">
        <div className="flex items-start justify-between px-10 pt-6">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-foreground">Início</div>
            <div className="mono text-xs text-text-muted">{artigos.length} artigo(s)</div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-grow overflow-y-auto px-10 pt-5 pb-8">
          <div className="flex max-w-[800px] flex-col gap-9">
            {artigos.length === 0 && (
              <p className="text-sm text-text-secondary">
                Nenhum artigo coletado ainda. Cadastre um tópico e uma fonte em{" "}
                <span className="font-semibold">Gerenciar fontes</span>.
              </p>
            )}

            {secoes.map((secao) => (
              <div key={secao.titulo} className="flex flex-col gap-3.5">
                <div
                  className={`mono border-b pb-1.5 text-[13px] font-bold tracking-wider uppercase ${
                    secao.pendente
                      ? "border-border text-text-muted"
                      : "border-foreground text-foreground"
                  }`}
                >
                  {secao.titulo}
                </div>
                <div className="flex flex-col gap-4">
                  {secao.artigos.map((artigo) => (
                    <Card key={artigo.id} artigo={artigo} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
