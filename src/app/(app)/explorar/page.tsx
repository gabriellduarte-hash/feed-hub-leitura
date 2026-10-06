import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { faviconDe, hostDe } from "@/lib/fonte";
import { Conteudo } from "@/components/FeedLayout";
import { Icon, type NomeIcone } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { BotaoSeguir, SeguirPorUrlForm } from "./Seguir";

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
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor.trim() : "";
}

function semAcento(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export default async function SeguirFontesPage(props: PageProps<"/explorar">) {
  const params = await props.searchParams;
  const aba = texto(params.aba) === "url" ? "url" : "sites";
  const termo = texto(params.q);
  const categoria = texto(params.categoria);
  const colecaoId = texto(params.colecao);

  const supabase = await createClient();
  const [{ data: catalogoData }, { data: fontesSeguidas }, { data: topicos }] = await Promise.all([
    supabase.from("feed_catalog").select("id, category, name, url, description, kind").order("name"),
    supabase.from("sources").select("url"),
    supabase.from("topics").select("id, name").order("created_at"),
  ]);
  const catalogo = (catalogoData ?? []) as ItemCatalogo[];
  const seguidas = new Set((fontesSeguidas ?? []).map((f) => f.url as string));
  const colecoes = (topicos ?? []).map((t) => ({ id: t.id as string, nome: t.name as string }));
  const colecaoPreferida = colecoes.find((c) => c.id === colecaoId);

  const categorias = [...new Set(catalogo.map((c) => c.category))];
  const busca = semAcento(termo);
  const resultados = catalogo.filter(
    (c) =>
      (!categoria || c.category === categoria) &&
      (!busca ||
        semAcento(`${c.name} ${c.description ?? ""} ${c.category} ${c.url}`).includes(busca)),
  );
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
          <Form action="/explorar" className="mb-10">
            {colecaoPreferida && <input type="hidden" name="colecao" value={colecaoPreferida.id} />}
            <label className="flex h-12 items-center gap-3 rounded-lg border border-border px-4 transition-colors focus-within:border-text-muted">
              <Icon nome="buscar" className="text-text-muted" />
              <input
                name="q"
                defaultValue={termo}
                placeholder="Busque por tema ou site"
                className="h-full flex-grow bg-transparent text-[15px] text-foreground outline-none placeholder:text-text-muted"
              />
            </label>
          </Form>

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

              {resultados.length === 0 && (
                <p className="text-sm text-text-secondary">
                  Nenhuma fonte encontrada. Se você tem o endereço do site,{" "}
                  <Link href={`/explorar?aba=url${sufixoColecao}`} className="text-accent hover:underline">
                    siga por link
                  </Link>
                  .
                </p>
              )}

              <div className="flex flex-col">
                {resultados.map((item, i) => (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    className="animate-fade-up -mx-3 flex items-center gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-surface-hover/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconDe(hostDe(item.url))}
                      alt=""
                      className="aspect-square h-12 w-12 flex-shrink-0 rounded-md bg-surface-active p-2 ring-1 ring-border"
                    />
                    <div className="flex min-w-0 flex-grow flex-col gap-0.5">
                      <div className="text-[15px] font-semibold text-foreground">{item.name}</div>
                      <div className="truncate text-[13px] text-text-muted">
                        {hostDe(item.url)} · #{item.category.toLowerCase()}
                      </div>
                      {item.description && (
                        <div className="truncate text-[13px] text-text-secondary">{item.description}</div>
                      )}
                    </div>
                    {seguidas.has(item.url) ? (
                      <span className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary">
                        <Icon nome="check" tamanho={15} />
                        Seguindo
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
                  </div>
                ))}
              </div>
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
