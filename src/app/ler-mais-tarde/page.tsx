import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard, type Artigo } from "@/components/ArticleCard";

export default async function LerMaisTardePage() {
  const supabase = await createClient();

  const { data: topicos } = await supabase.from("topics").select("id, name").order("created_at");

  const { data } = await supabase
    .from("saved_articles")
    .select(
      "created_at, articles(id, title, url, author, content, ai_summary, category, published_at, image_url)",
    )
    .order("created_at", { ascending: false });

  // Sem tipos gerados pro schema ainda — o cliente não sabe que
  // article_id -> articles.id é muitos-pra-um (embed vira 1 objeto,
  // não array), por isso o cast manual.
  const linhas = (data ?? []) as unknown as { articles: Artigo | null }[];
  const artigos = linhas
    .map((linha) => linha.articles)
    .filter((artigo): artigo is Artigo => artigo !== null);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar topicos={topicos ?? []} />

      <div className="flex min-w-0 flex-grow flex-col">
        <div className="px-10 pt-6">
          <div className="text-2xl font-bold text-foreground">Ler mais tarde</div>
          <div className="mono text-xs text-text-muted">{artigos.length} artigo(s) salvo(s)</div>
        </div>

        <div className="flex-grow overflow-y-auto px-10 pt-5 pb-8">
          <div className="flex max-w-[800px] flex-col gap-4">
            {artigos.length === 0 && (
              <p className="text-sm text-text-secondary">
                Nada salvo ainda — clica no ícone de marcador em qualquer artigo do feed.
              </p>
            )}
            {artigos.map((artigo) => (
              <ArticleCard key={artigo.id} artigo={artigo} salvo path="/ler-mais-tarde" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
