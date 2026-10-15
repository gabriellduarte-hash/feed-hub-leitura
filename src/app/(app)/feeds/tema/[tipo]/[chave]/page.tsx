import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarPagina } from "@/lib/feed";
import { rotuloDoTema, type TipoSeguido } from "@/lib/seguir";
import { ArticleList } from "@/components/ArticleList";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { BotaoSeguirTema } from "@/components/Temas";

/* As notícias de um tema ou nome (sql/046), como a página de uma fonte:
 * últimos 7 dias, das fontes da pessoa e do catálogo, uma por história.
 * Abre também pra quem ainda não segue (o botão segue dali mesmo). */
export default async function TemaPage(props: PageProps<"/feeds/tema/[tipo]/[chave]">) {
  const params = await props.params;
  if (params.tipo !== "tema" && params.tipo !== "nome") notFound();
  const tipo: TipoSeguido = params.tipo;
  let chave = params.chave;
  try {
    chave = decodeURIComponent(chave);
  } catch {
    // já veio decodificada
  }
  if (!chave || chave.length > 80) notFound();
  const tema = { tipo, chave };

  const supabase = await createClient();
  const [pagina, { data: seguido }, { data: sugestao }] = await Promise.all([
    buscarPagina(supabase, { seguindo: true, tema }),
    supabase.from("seguindo").select("rotulo").eq("tipo", tipo).eq("chave", chave).maybeSingle(),
    supabase.from("sugestoes_seguir").select("rotulo").eq("tipo", tipo).eq("chave", chave).maybeSingle(),
  ]);
  // como mostrar: o que a pessoa seguiu, o mais citado, ou como aparece numa notícia
  const daNoticia = pagina.artigos.flatMap((a) => a.entidades ?? []).find((e) => e.chave === chave)?.nome;
  const rotulo = (seguido?.rotulo as string | undefined) ?? (sugestao?.rotulo as string | undefined) ?? daNoticia ?? chave;

  return (
    <Conteudo>
      <PageHeader
        sobretitulo="Temas"
        titulo={rotuloDoTema({ tipo, rotulo })}
        subtitulo="Notícias dos últimos 7 dias, nas suas fontes e em sites do Brasil, uma por história"
        acoes={<BotaoSeguirTema item={{ tipo, chave, rotulo }} />}
      />
      {pagina.artigos.length === 0 ? (
        <Vazio titulo="Nada nos últimos 7 dias" texto="Nenhuma notícia recente fala disso. Novas notícias chegam a cada hora." />
      ) : (
        <ArticleList key={`tema-${tipo}-${chave}`} origem="seguindo" feed={{ ...pagina, filtro: { seguindo: true, tema } }} />
      )}
    </Conteudo>
  );
}
