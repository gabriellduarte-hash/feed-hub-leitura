import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buscarPagina, buscarTrending, categoriasDoCatalogo, contarNaoLidos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader, Tabs } from "@/components/PageHeader";
import { PainelSeguindo } from "@/components/PainelSeguindo";
import { sugerirParaSeguir } from "@/app/actions/seguir";
import { idDoItem, type ItemSeguido } from "@/lib/seguir";

export default async function InicioPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const aba = params.aba === "explorar" || params.aba === "seguindo" ? params.aba : "eu";
  const supabase = await createClient();

  return (
    <Conteudo>
      <PageHeader
        titulo="Início"
        subtitulo={
          aba === "eu"
            ? "As últimas das fontes que você segue"
            : aba === "seguindo"
              ? "Os temas e nomes que você segue, nas suas fontes e em sites do Brasil"
              : "As últimas de sites de notícias do Brasil"
        }
        acoes={aba === "eu" ? <FeedActions escopo={{ tipo: "todos" }} naoLidos={await contarNaoLidos(supabase)} /> : undefined}
      />
      <Tabs
        ativa={aba}
        abas={[
          { chave: "eu", rotulo: "Eu", href: "/" },
          { chave: "seguindo", rotulo: "Seguindo", href: "/?aba=seguindo" },
          { chave: "explorar", rotulo: "Explorar", href: "/?aba=explorar" },
        ]}
      />
      {aba === "eu" ? (
        <AbaEu />
      ) : aba === "seguindo" ? (
        <AbaSeguindo />
      ) : (
        <AbaExplorar categoria={typeof params.categoria === "string" ? params.categoria : undefined} />
      )}
    </Conteudo>
  );
}

async function AbaEu() {
  const supabase = await createClient();
  const [pagina, destaques] = await Promise.all([buscarPagina(supabase, {}), buscarTrending(supabase)]);
  if (pagina.artigos.length === 0) {
    return (
      <Vazio
        titulo="Seu feed está vazio"
        texto="Siga alguns sites para ver as notícias deles aqui."
        acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
      />
    );
  }
  return <ArticleList key="eu" feed={{ ...pagina, filtro: {} }} destaques={destaques} />;
}

/* Temas e nomes seguidos (sql/045): uma notícia por história, dos
 * últimos 7 dias, das fontes da pessoa e do catálogo. */
async function AbaSeguindo() {
  const supabase = await createClient();
  const [{ data }, pagina, emAlta] = await Promise.all([
    supabase.from("seguindo").select("tipo, chave, rotulo"),
    buscarPagina(supabase, { seguindo: true }),
    sugerirParaSeguir(""),
  ]);
  const seguidos = (data ?? []) as ItemSeguido[];
  // a lista recomeça (sem as páginas já carregadas) quando o que a pessoa segue muda
  const chave = seguidos.map(idDoItem).sort().join("|");

  return (
    <>
      <PainelSeguindo emAlta={emAlta} />
      {seguidos.length === 0 ? (
        <Vazio
          titulo="Siga temas e nomes"
          texto="Pessoas, times, empresas, filmes, jogos ou um assunto inteiro. As notícias deles aparecem aqui, uma por história, e as mais importantes sobem no seu resumo por e-mail. Dá pra seguir também pelos nomes no alto de cada notícia."
        />
      ) : pagina.artigos.length === 0 ? (
        <Vazio
          titulo="Nada nos últimos 7 dias"
          texto="Nenhuma notícia recente fala do que você segue. Novas notícias chegam a cada hora."
        />
      ) : (
        <ArticleList key={`seguindo-${chave}`} origem="seguindo" feed={{ ...pagina, filtro: { seguindo: true } }} />
      )}
    </>
  );
}

async function AbaExplorar({ categoria }: { categoria?: string }) {
  const supabase = await createClient();
  const categorias = await categoriasDoCatalogo(supabase);
  const ativa = categoria && categorias.includes(categoria) ? categoria : undefined;
  const [pagina, destaques] = await Promise.all([
    buscarPagina(supabase, { catalogo: true, categoria: ativa }),
    buscarTrending(supabase, ativa),
  ]);

  return (
    <>
      <div className="-mt-4 mb-8 flex flex-wrap gap-2">
        <Chip href="/?aba=explorar" ativo={!ativa}>
          Tudo
        </Chip>
        {categorias.map((c) => (
          <Chip key={c} href={`/?aba=explorar&categoria=${encodeURIComponent(c)}`} ativo={ativa === c}>
            #{c.toLowerCase()}
          </Chip>
        ))}
      </div>
      {pagina.artigos.length === 0 ? (
        <Vazio
          titulo="Nenhuma notícia por aqui ainda"
          texto="Novas notícias chegam a cada hora. Volte daqui a pouco."
          acao={{ rotulo: "Ver sites para seguir", href: "/explorar" }}
        />
      ) : (
        <ArticleList
          key={`explorar-${ativa ?? "tudo"}`}
          origem="explorar"
          feed={{ ...pagina, filtro: { catalogo: true, categoria: ativa } }}
          destaques={destaques}
        />
      )}
    </>
  );
}

function Chip({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`rounded-lg border px-3 py-1.5 text-[12px] transition duration-150 active:scale-95 ${
        ativo
          ? "border-foreground bg-foreground font-semibold text-background"
          : "border-border text-text-secondary hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </Link>
  );
}
