import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  agruparPorDia,
  artigosNaUltimaSemana,
  buscarArtigos,
  buscarSugestoes,
  categoriasPredominantes,
  contarNaoLidos,
} from "@/lib/feed";
import { hostDe, nomeDaFonte } from "@/lib/fonte";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, FeedComSugestoes, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function FontePage(props: PageProps<"/feeds/fonte/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: fonte } = await supabase
    .from("sources")
    .select("id, name, url, favorite, topic_id")
    .eq("id", id)
    .maybeSingle();
  if (!fonte) notFound();

  const [artigos, naoLidos, porSemana, { data: colecoes }, { data: noCatalogo }] =
    await Promise.all([
      buscarArtigos(supabase, { fonteId: id, limite: 100 }),
      contarNaoLidos(supabase, [id]),
      artigosNaUltimaSemana(supabase, id),
      supabase.from("topics").select("id, name").order("created_at"),
      supabase.from("feed_catalog").select("category").eq("url", fonte.url).maybeSingle(),
    ]);

  const categorias = categoriasPredominantes(artigos);
  const sugestoes = await buscarSugestoes(supabase, noCatalogo?.category ?? categorias[0]);
  const nome = nomeDaFonte(fonte.name, fonte.url);

  return (
    <Conteudo largo>
      <PageHeader
        titulo={nome}
        subtitulo={
          <span className="text-[13px] text-text-muted">
            {porSemana} artigos por semana / {hostDe(fonte.url)}
            {categorias.map((c) => (
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
        secoes={agruparPorDia(artigos)}
        sugestoes={sugestoes}
        vazio={
          <Vazio
            titulo="Nenhum artigo desta fonte ainda"
            texto="Os artigos aparecem aqui depois da próxima coleta (roda todo dia às 6h)."
          />
        }
      />
    </Conteudo>
  );
}
