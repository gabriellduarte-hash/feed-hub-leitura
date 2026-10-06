import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  artigosNaUltimaSemana,
  buscarPagina,
  buscarSugestoes,
  categoriaDaColecao,
  categoriasPredominantes,
  contarNaoLidos,
} from "@/lib/feed";
import { hostDe, nomeDaFonte } from "@/lib/fonte";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, FeedComSugestoes, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function FontePage(props: PageProps<"/feeds/fonte/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: fonte } = await supabase
    .from("sources")
    .select("id, name, url, favorite, topic_id, topics(name)")
    .eq("id", id)
    .maybeSingle();
  if (!fonte) notFound();

  // Sem tipos gerados: o embed many-to-one (sources -> topics) vem como objeto
  const nomeColecao = (fonte.topics as unknown as { name: string } | null)?.name ?? "";

  const [pagina, naoLidos, porSemana, { data: colecoes }, categoria] = await Promise.all([
    buscarPagina(supabase, { fonteId: id }),
    contarNaoLidos(supabase, [id]),
    artigosNaUltimaSemana(supabase, id),
    supabase.from("topics").select("id, name").order("created_at"),
    // Recomendação pela categoria da coleção em que essa fonte está
    categoriaDaColecao(supabase, fonte.topic_id, nomeColecao),
  ]);

  const tags = categoriasPredominantes(pagina.artigos);
  const sugestoes = await buscarSugestoes(supabase, categoria, { somenteCategoria: true });
  const nome = nomeDaFonte(fonte.name, fonte.url);

  return (
    <Conteudo largo>
      <PageHeader
        titulo={nome}
        sobretitulo={nomeColecao || undefined}
        subtitulo={
          <span className="text-text-muted">
            {porSemana} artigos por semana / {hostDe(fonte.url)}
            {tags.map((c) => (
              <span key={c} className="ml-2">
                #{c.toLowerCase()}
              </span>
            ))}
          </span>
        }
        acoes={
          <FeedActions
            key={id}
            escopo={{ tipo: "fonte", id }}
            naoLidos={naoLidos}
            fonte={{ id, nome, favorita: fonte.favorite, topicoId: fonte.topic_id }}
            colecoes={(colecoes ?? []).map((c) => ({ id: c.id, nome: c.name }))}
          />
        }
      />
      <FeedComSugestoes
        categoria={categoria}
        sugestoes={sugestoes}
        lista={
          pagina.artigos.length === 0 ? (
            <Vazio
              titulo="Nenhuma notícia desta fonte ainda"
              texto="Novas notícias chegam a cada hora. Volte daqui a pouco."
            />
          ) : (
            <ArticleList key={id} feed={{ ...pagina, filtro: { fonteId: id } }} />
          )
        }
      />
    </Conteudo>
  );
}
