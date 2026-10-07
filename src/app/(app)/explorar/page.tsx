import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS } from "@/lib/feed";
import { faviconDe, hostDe } from "@/lib/fonte";
import { Conteudo } from "@/components/FeedLayout";
import { Icon, type NomeIcone } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { BotaoSeguir, BuscaNaWeb, LinhaFonte, SeguirPorUrlForm } from "./Seguir";

// Adicionar fonte detecta o tipo e já coleta as notícias: pode passar dos
// 10s padrão quando o site é lento (ver docs: route segment config).
export const maxDuration = 60;

type ItemCatalogo = {
  id: string;
  category: string;
  name: string;
  url: string;
  description: string | null;
  kind: string;
  idioma: string;
  regiao: string | null;
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor.trim() : "";
}

function semAcento(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Quanto menor, mais acima: nome começando com o termo, nome com o
 * termo, site com o termo, e por último descrição/tema. -1 = não serve. */
function relevancia(item: ItemCatalogo, busca: string) {
  if (!busca) return 0;
  const nome = semAcento(item.name);
  if (nome.startsWith(busca)) return 0;
  if (nome.includes(busca)) return 1;
  if (semAcento(hostDe(item.url)).includes(busca)) return 2;
  if (semAcento(item.regiao ?? "").includes(busca)) return 3;
  if (semAcento(`${item.description ?? ""} ${item.category}`).includes(busca)) return 4;
  return -1;
}

export default async function SeguirFontesPage(props: PageProps<"/explorar">) {
  const params = await props.searchParams;
  const aba = texto(params.aba) === "url" ? "url" : "sites";
  const termo = texto(params.q);
  const categoria = texto(params.categoria);
  const colecaoId = texto(params.colecao);

  const supabase = await createClient();
  const [{ data: catalogoData }, { data: fontesSeguidas }, { data: topicos }] = await Promise.all([
    supabase.from("feed_catalog").select("id, category, name, url, description, kind, idioma, regiao").order("name"),
    supabase.from("sources").select("url"),
    supabase.from("topics").select("id, name").order("created_at"),
  ]);
  const catalogo = (catalogoData ?? []) as ItemCatalogo[];
  const seguidas = new Set((fontesSeguidas ?? []).map((f) => f.url as string));
  const colecoes = (topicos ?? []).map((t) => ({ id: t.id as string, nome: t.name as string }));
  const colecaoPreferida = colecoes.find((c) => c.id === colecaoId);

  const presentes = new Set(catalogo.map((c) => c.category));
  const categorias = CATEGORIAS.filter((c) => presentes.has(c));
  const busca = semAcento(termo);
  const resultados = catalogo
    .map((c) => ({ c, r: relevancia(c, busca) }))
    .filter(({ c, r }) => r >= 0 && (!categoria || c.category === categoria))
    .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name, "pt-BR"))
    .map(({ c }) => c);
  const listando = !!termo || !!categoria;
  const sufixoColecao = colecaoPreferida ? `&colecao=${colecaoPreferida.id}` : "";

  return (
    <Conteudo>
      <PageHeader titulo="Seguir fontes" />

      <nav className="-mt-2 mb-8 flex gap-7 border-b border-border">
        <Aba href={`/explorar?aba=sites${sufixoColecao}`} ativa={aba === "sites"} icone="globo">
          Sites
        </Aba>
        <Aba href={`/explorar?aba=url${sufixoColecao}`} ativa={aba === "url"} icone="link">
          Por link
        </Aba>
      </nav>

      {colecaoPreferida && (
        <div className="animate-fade-up mb-6 flex items-center justify-between rounded-lg bg-accent-soft px-4 py-2.5 text-sm text-foreground">
          <span>
            Adicionando à coleção <b>{colecaoPreferida.nome}</b>
          </span>
          <Link
            href={`/explorar?aba=${aba}`}
            className="text-text-secondary transition-colors hover:text-foreground"
          >
            <Icon nome="fechar" tamanho={16} />
          </Link>
        </div>
      )}

      {aba === "url" ? (
        <SeguirPorUrlForm colecoes={colecoes} colecaoPreferida={colecaoPreferida?.id} />
      ) : (
        <>
          <Form action="/explorar" className={listando ? "mb-4" : "mb-10"}>
            {colecaoPreferida && <input type="hidden" name="colecao" value={colecaoPreferida.id} />}
            <label className="flex h-12 items-center gap-3 rounded-lg border border-border bg-surface px-4 transition-colors focus-within:border-text-muted">
              <Icon nome="buscar" className="text-text-muted" />
              <input
                key={termo}
                name="q"
                defaultValue={termo}
                placeholder="Busque por veículo, site ou tema"
                className="h-full min-w-0 flex-grow bg-transparent text-[15px] text-foreground outline-none placeholder:text-text-muted"
              />
              {listando && (
                <Link
                  href={`/explorar?aba=sites${sufixoColecao}`}
                  aria-label="Limpar busca"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:text-foreground"
                >
                  <Icon nome="fechar" tamanho={18} />
                </Link>
              )}
            </label>
          </Form>

          {/* durante a busca, os temas viram atalho (no celular rola pro lado) */}
          <div className={`-mx-4 mb-10 gap-2 ${listando ? "flex" : "hidden"} overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0`}>
            {categorias.map((cat) => (
              <Link
                key={cat}
                href={`/explorar?categoria=${encodeURIComponent(cat)}${sufixoColecao}`}
                className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
                  categoria === cat
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "border-border text-text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                <span className={categoria === cat ? "" : "text-accent"}>#</span>
                {cat.toLowerCase()}
              </Link>
            ))}
          </div>

          {!listando ? (
            <>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Temas</h2>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {categorias.map((cat, i) => {
                  const destaque = catalogo.find((c) => c.category === cat)!;
                  return (
                    <Link
                      key={cat}
                      href={`/explorar?categoria=${encodeURIComponent(cat)}${sufixoColecao}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="animate-fade-up group flex h-[124px] flex-col justify-between rounded-lg border border-border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 "
                    >
                      <span className="text-[15px] font-semibold text-foreground"><span className="text-accent">#</span>{cat.toLowerCase()}</span>
                      <span className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={faviconDe(hostDe(destaque.url))}
                          alt=""
                          className="h-7 w-7 rounded-md transition-transform duration-200 group-hover:scale-110"
                        />
                        <span className="min-w-0 text-xs leading-tight text-text-muted">
                          Destaque
                          <span className="block truncate">{destaque.name}</span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <Link
                  href={`/explorar?aba=sites${sufixoColecao}`}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
                  title="Voltar"
                >
                  <Icon nome="chevronEsquerda" />
                </Link>
                <h2 className="text-lg font-semibold text-foreground">
                  {categoria ? `#${categoria.toLowerCase()}` : `Resultados para "${termo}"`}
                </h2>
              </div>

              {resultados.length > 0 && (
                <h3 className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                  {termo ? "No catálogo" : "Fontes"}
                </h3>
              )}
              {resultados.length === 0 && !termo && (
                <p className="text-sm text-text-secondary">Nenhuma fonte neste tema ainda.</p>
              )}

              <div className="flex flex-col">
                {resultados.map((item) => (
                  <LinhaFonte
                    key={item.id}
                    nome={item.name}
                    host={hostDe(item.url)}
                    detalhe={[`#${item.category.toLowerCase()}`, item.regiao, item.idioma === "en" ? "em inglês" : null]
                      .filter(Boolean)
                      .join(" · ")}
                    descricao={item.description}
                  >
                    {seguidas.has(item.url) ? (
                      <span
                        title="Seguindo"
                        className="flex h-9 w-9 items-center justify-center gap-1.5 rounded-full border border-border text-sm text-text-secondary sm:h-8 sm:w-auto sm:rounded-md sm:px-3"
                      >
                        <Icon nome="check" tamanho={15} />
                        <span className="hidden sm:inline">Seguindo</span>
                      </span>
                    ) : (
                      <BotaoSeguir
                        catalogoId={item.id}
                        nome={item.name}
                        categoria={item.category}
                        colecoes={colecoes}
                        colecaoPreferida={colecaoPreferida}
                      />
                    )}
                  </LinhaFonte>
                ))}
              </div>

              {termo && <BuscaNaWeb termo={termo} colecoes={colecoes} colecaoPreferida={colecaoPreferida} />}

              {termo && (
                <p className="mt-10 text-[13px] text-text-secondary">
                  Não achou? Se você tem o endereço do site,{" "}
                  <Link href={`/explorar?aba=url${sufixoColecao}`} className="text-accent hover:underline">
                    siga por link
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </>
      )}
    </Conteudo>
  );
}

function Aba({
  href,
  ativa,
  icone,
  children,
}: {
  href: string;
  ativa: boolean;
  icone: NomeIcone;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 pb-2.5 text-[14px] transition-colors ${
        ativa
          ? "font-semibold text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent"
          : "text-text-secondary hover:text-foreground"
      }`}
    >
      <Icon nome={icone} tamanho={17} />
      {children}
    </Link>
  );
}
