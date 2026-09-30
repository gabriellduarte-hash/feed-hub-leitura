import { createClient } from "@/lib/supabase/server";
import { buscarIdsSalvos } from "@/lib/saved-ids";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArticleCard, type Artigo } from "@/components/ArticleCard";

// Mesma ordem fixa de categorias usada em resumo/resumir.py (Python) —
// mantém as seções do feed na mesma ordem entre o e-mail e o hub.
const CATEGORIAS = [
  "Tecnologia", "Finanças", "Humor", "Política", "Ciência",
  "Saúde", "Esportes", "Entretenimento", "Mundo", "Outros",
];
const SEM_CATEGORIA = "__sem_categoria__";

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
  const salvos = await buscarIdsSalvos(supabase);

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
                    <ArticleCard
                      key={artigo.id}
                      artigo={artigo}
                      salvo={salvos.has(artigo.id)}
                      path="/"
                    />
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
