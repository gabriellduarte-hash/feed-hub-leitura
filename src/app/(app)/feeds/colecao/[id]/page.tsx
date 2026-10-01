import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  agruparPorDia,
  buscarArtigos,
  buscarSugestoes,
  categoriasPredominantes,
  contarNaoLidos,
} from "@/lib/feed";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, FeedComSugestoes, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";

export default async function ColecaoPage(props: PageProps<"/feeds/colecao/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: colecao } = await supabase
    .from("topics")
    .select("id, name, sources(id)")
    .eq("id", id)
    .maybeSingle();
  if (!colecao) notFound();

  const fonteIds = colecao.sources.map((s) => s.id as string);
  const artigos = await buscarArtigos(supabase, { topicoId: id, limite: 100 });
  const [naoLidos, sugestoes] = await Promise.all([
    contarNaoLidos(supabase, fonteIds),
    buscarSugestoes(supabase, categoriasPredominantes(artigos, 1)[0]),
  ]);

  return (
    <Conteudo largo>
      <PageHeader
        titulo={colecao.name}
        subtitulo={`${fonteIds.length} ${fonteIds.length === 1 ? "fonte" : "fontes"}`}
        acoes={
          <FeedActions
            escopo={{ tipo: "colecao", id }}
            naoLidos={naoLidos}
            colecao={{ id, nome: colecao.name }}
          />
        }
      />
      <FeedComSugestoes
        secoes={agruparPorDia(artigos)}
        sugestoes={sugestoes}
        vazio={
          <Vazio
            titulo="Nenhum artigo nesta coleção"
            texto="Adicione uma fonte a esta coleção, ou espere a próxima coleta."
            acao={{ rotulo: "Adicionar fonte", href: `/explorar?colecao=${id}` }}
          />
        }
      />
    </Conteudo>
  );
}
