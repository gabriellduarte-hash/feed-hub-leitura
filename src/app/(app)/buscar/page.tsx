import { createClient } from "@/lib/supabase/server";
import { buscarArtigos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo } from "@/components/FeedLayout";
import { BuscaNasNoticias } from "@/components/BuscaNasNoticias";
import { PageHeader } from "@/components/PageHeader";
import { registrarBusca } from "@/lib/eventos";
import { sugerirParaSeguir, temasDaBusca } from "@/app/actions/seguir";
import { ChipSeguir } from "@/components/Seguindo";

export default async function BuscarPage(props: PageProps<"/buscar">) {
  const { q } = await props.searchParams;
  const termo = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  // as que têm as palavras e, junto, as do tema buscado ("fofoca", "hq")
  const [pelasPalavras, temasBuscados, temas] = termo
    ? await Promise.all([buscarArtigos(supabase, { busca: termo }), temasDaBusca(termo), sugerirParaSeguir(termo)])
    : [[], [], []];
  const peloTema = temasBuscados.length ? await buscarArtigos(supabase, { temas: temasBuscados }) : [];
  const vistas = new Set<string>();
  const artigos = [...pelasPalavras, ...peloTema]
    .filter((a) => !vistas.has(a.id) && vistas.add(a.id))
    .sort((a, b) => (b.quando ?? "").localeCompare(a.quando ?? ""))
    .slice(0, 60);
  if (termo) await registrarBusca(supabase, { origem: "noticias", termo, resultados: artigos.length });

  return (
    <Conteudo>
      <PageHeader titulo="Buscar" />
      <BuscaNasNoticias termo={termo} focar />

      {/* "fofoca", "filmes", "lula": o tema ou o nome pra seguir, além das notícias */}
      {temas.length > 0 && (
        <section aria-label="Temas e nomes para seguir" className="-mt-4 mb-10 flex flex-col gap-2.5">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">Seguir</h2>
          <div className="flex flex-wrap gap-2">
            {temas.slice(0, 8).map((t) => (
              <ChipSeguir key={`${t.tipo}:${t.chave}`} item={{ tipo: t.tipo, chave: t.chave, rotulo: t.rotulo }} />
            ))}
          </div>
        </section>
      )}

      {termo && artigos.length === 0 && (
        <p className="text-sm text-text-secondary">Nada encontrado para &quot;{termo}&quot;.</p>
      )}
      {artigos.length > 0 && (
        <ArticleList
          key={termo}
          origem="busca"
          secoes={[
            {
              titulo: `${artigos.length} ${artigos.length === 1 ? "resultado" : "resultados"} para "${termo}"`,
              artigos,
            },
          ]}
        />
      )}
    </Conteudo>
  );
}
