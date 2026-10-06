import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buscarPagina, categoriasDoCatalogo, contarNaoLidos } from "@/lib/feed";
import { ArticleList } from "@/components/ArticleList";
import { FeedActions } from "@/components/FeedActions";
import { Conteudo, Vazio } from "@/components/FeedLayout";
import { PageHeader, Tabs } from "@/components/PageHeader";

export default async function InicioPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const aba = params.aba === "explorar" ? "explorar" : "eu";
  const supabase = await createClient();

  return (
    <Conteudo>
      <PageHeader
        titulo="Início"
        subtitulo={
          aba === "eu"
            ? "As últimas das fontes que você segue"
            : "As últimas de sites de notícias do Brasil"
        }
        acoes={aba === "eu" ? <FeedActions escopo={{ tipo: "todos" }} naoLidos={await contarNaoLidos(supabase)} /> : undefined}
      />
      <Tabs
        ativa={aba}
        abas={[
          { chave: "eu", rotulo: "Eu", href: "/" },
          { chave: "explorar", rotulo: "Explorar", href: "/?aba=explorar" },
        ]}
      />
      {aba === "eu" ? (
        <AbaEu />
      ) : (
        <AbaExplorar categoria={typeof params.categoria === "string" ? params.categoria : undefined} />
      )}
    </Conteudo>
  );
}

async function AbaEu() {
  const supabase = await createClient();
  const pagina = await buscarPagina(supabase, {});
  if (pagina.artigos.length === 0) {
    return (
      <Vazio
        titulo="Seu feed está vazio"
        texto="Siga alguns sites para ver as notícias deles aqui."
        acao={{ rotulo: "Seguir fontes", href: "/explorar" }}
      />
    );
  }
  return <ArticleList key="eu" feed={{ ...pagina, filtro: {} }} />;
}

async function AbaExplorar({ categoria }: { categoria?: string }) {
  const supabase = await createClient();
  const categorias = await categoriasDoCatalogo(supabase);
  const ativa = categoria && categorias.includes(categoria) ? categoria : undefined;
  const pagina = await buscarPagina(supabase, { catalogo: true, categoria: ativa });

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
        <ArticleList key={`explorar-${ativa ?? "tudo"}`} feed={{ ...pagina, filtro: { catalogo: true, categoria: ativa } }} />
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
