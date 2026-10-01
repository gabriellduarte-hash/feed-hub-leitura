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

export default async function TodosPage() {
  const supabase = await createClient();
  const artigos = await buscarArtigos(supabase, { limite: 100 });
  const [naoLidos, sugestoes] = await Promise.all([
    contarNaoLidos(supabase),
    buscarSugestoes(supabase, categoriasPredominantes(artigos, 1)[0]),
  ]);

  return (
    <Conteudo largo>
      <PageHeader
        titulo="Todos"
        acoes={<FeedActions escopo={{ tipo: "todos" }} naoLidos={naoLidos} />}
      />
      <FeedComSugestoes
        secoes={agruparPorDia(artigos)}
        sugestoes={sugestoes}
        vazio={
          <Vazio
            titulo="Nada por aqui ainda"
            texto="Siga alguns sites e os artigos aparecem aqui."
            acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
          />
        }
      />
    </Conteudo>
  );
}
