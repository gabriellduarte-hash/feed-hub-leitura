import Link from "next/link";

/* Painéis da página Relatórios (app/(app)/relatorios): números do
 * período, rankings em barra (uma série, cor única, valor na ponta),
 * colunas por hora (aviso no hover/foco e tabela pra leitor de tela) e
 * tabelas de fontes e buscas. Tudo já agregado pela função relatorio_uso. */

export type Item = { nome: string; total: number; pessoas?: number };
export type Fonte = { nome: string; url: string; seguidores: number; no_catalogo?: boolean; na_vitrine?: boolean };
export type Busca = { termo: string; onde: string; pessoas: number; vezes: number; resultados?: number };
export type Relatorio = {
  dias: number;
  usuarios: { total: number; novos: number; ativos_7d: number; ativos_periodo: number; resumo_ligado: number; resumos_enviados: number };
  aberturas: number;
  aberturas_por_origem: Item[];
  categorias: Item[];
  categorias_lidas_no_feed: Item[];
  sites_mais_abertos: Item[];
  assuntos: Item[];
  horarios: { hora: number; total: number }[];
  fontes_mais_seguidas: Fonte[];
  candidatas_ao_catalogo: Fonte[];
  candidatas_a_vitrine: Fonte[];
  seguiram_por_caminho: Item[];
  deixaram_de_seguir: Item[];
  buscas: Busca[];
  buscas_sem_resultado: Busca[];
  colecoes: Item[];
};

const NOMES_DE_ORIGEM: Record<string, string> = {
  feed: "Feed",
  explorar: "Explorar",
  trending: "Trending",
  busca: "Busca",
  salvos: "Ler mais tarde",
  lidos: "Lidos recentemente",
  seguindo: "Seguindo",
  catalogo: "Catálogo",
  web: "Busca na web",
  link: "Link colado",
  noticias: "notícias",
  fontes: "fontes",
};
const nomeDaOrigem = (o: string) => NOMES_DE_ORIGEM[o] ?? o;
const numero = (n: number) => n.toLocaleString("pt-BR");

export function PaineisDoRelatorio({ r }: { r: Relatorio }) {
  const u = r.usuarios;
  const categorias = r.categorias.length > 0 ? r.categorias : r.categorias_lidas_no_feed;
  return (
    <div className="flex flex-col gap-12 pb-10">
      <section aria-label="Números do período" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Numero rotulo="Usuários" valor={u.total} detalhe={`${numero(u.novos)} ${u.novos === 1 ? "novo" : "novos"} no período`} />
        <Numero rotulo="Ativos na semana" valor={u.ativos_7d} />
        <Numero rotulo="Ativos no período" valor={u.ativos_periodo} />
        <Numero rotulo="Notícias abertas" valor={r.aberturas} />
        <Numero rotulo="Resumo diário ligado" valor={u.resumo_ligado} />
        <Numero rotulo="Resumos enviados" valor={u.resumos_enviados} />
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Painel
          titulo="Categorias mais lidas"
          nota={
            r.categorias.length > 0
              ? "Notícias abertas no leitor."
              : "Ainda sem aberturas registradas: notícias lidas no feed (sem o “marcar tudo como lido”)."
          }
        >
          <Barras itens={categorias} />
        </Painel>
        <Painel titulo="Sites mais abertos" nota="Notícias abertas no leitor, por site.">
          <Barras itens={r.sites_mais_abertos} />
        </Painel>
        <Painel titulo="De onde as notícias são abertas">
          <Barras itens={r.aberturas_por_origem.map((o) => ({ ...o, nome: nomeDaOrigem(o.nome) }))} />
        </Painel>
        <Painel titulo="Horário das leituras" nota="Notícias abertas por hora do dia (horário de Brasília).">
          <Horarios horas={r.horarios} />
        </Painel>
      </div>

      <Painel titulo="Assuntos mais lidos" nota="Palavras-chave das notícias abertas.">
        {r.assuntos.length === 0 ? (
          <Vazio />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {r.assuntos.map((a) => (
              <li key={a.nome} className="rounded-md border border-border px-2.5 py-1 text-[12px] text-text-secondary">
                {a.nome} <span className="ml-1 text-text-muted tabular-nums">{numero(a.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <div className="grid gap-12 lg:grid-cols-2">
        <Painel titulo="Candidatas ao catálogo" nota="Seguidas por link e que ainda não estão no catálogo.">
          <TabelaFontes fontes={r.candidatas_ao_catalogo} />
        </Painel>
        <Painel titulo="Candidatas à vitrine" nota="No catálogo e seguidas, mas fora da aba Explorar.">
          <TabelaFontes fontes={r.candidatas_a_vitrine} />
        </Painel>
        <Painel titulo="Fontes mais seguidas">
          <TabelaFontes fontes={r.fontes_mais_seguidas} mostrarCatalogo />
        </Painel>
        <div className="flex flex-col gap-12">
          <Painel titulo="Como as pessoas seguem" nota="Por onde chegaram à fonte, no período.">
            <Barras itens={r.seguiram_por_caminho.map((o) => ({ ...o, nome: nomeDaOrigem(o.nome) }))} />
          </Painel>
          <Painel titulo="Deixaram de seguir">
            <Barras itens={r.deixaram_de_seguir.map((o) => ({ ...o, nome: hostDe(o.nome) }))} />
          </Painel>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <Painel titulo="Buscas sem resultado" nota="O sinal mais direto de fonte ou assunto que está faltando.">
          <TabelaBuscas buscas={r.buscas_sem_resultado} />
        </Painel>
        <Painel titulo="Buscas mais feitas">
          <TabelaBuscas buscas={r.buscas} comResultados />
        </Painel>
      </div>

      <Painel titulo="Coleções criadas" nota="Nomes que as pessoas dão às coleções: sinal de interesse.">
        <Barras itens={r.colecoes} />
      </Painel>
    </div>
  );
}

export type ParRespondido = { faixa: string; juntou: boolean; peso: number; resposta: "mesma" | "diferente" | "nao_sei" };

const FAIXAS = ["0-40", "40-50", "50-58", "58-65", "65-75", "75-100"];
const porcento = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)}%` : "—");

/** Fase 2 sem IA (sql/045): a amostra de pares marcada à mão diz se o
 * agrupamento acerta, e os temas e nomes mais seguidos. Montado na página
 * (não vem do relatorio_uso). */
export function PaineisDoAgrupamento({
  pares,
  pendentes,
  seguidos,
}: {
  pares: ParRespondido[];
  pendentes: number;
  seguidos: Item[];
}) {
  const respondidos = pares.filter((p) => p.resposta !== "nao_sei");
  // peso: quantos pares da janela cada um representa (o sorteio pega o
  // mesmo tanto de cada faixa, e as faixas têm tamanhos muito diferentes)
  let vp = 0,
    fp = 0,
    fn = 0;
  for (const p of respondidos) {
    const mesma = p.resposta === "mesma";
    if (p.juntou && mesma) vp += p.peso;
    else if (p.juntou) fp += p.peso;
    else if (mesma) fn += p.peso;
  }
  return (
    <div className="flex flex-col gap-12 border-t border-border pt-12 pb-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <Painel
          titulo="Agrupamento de histórias"
          nota="Pela amostra de pares marcada à mão, com as regras da hora do sorteio. Pra testar outros pesos: agrupar.py --medir."
        >
          <div className="grid grid-cols-3 gap-3">
            <Numero rotulo="Marcados" valor={respondidos.length} detalhe={`${numero(pendentes)} pra marcar`} />
            <NumeroTexto rotulo="Precisão" valor={porcento(vp, vp + fp)} detalhe="das que juntou, eram a mesma" />
            <NumeroTexto rotulo="Cobertura" valor={porcento(vp, vp + fn)} detalhe="das que eram a mesma, juntou" />
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] text-text-muted">
                <th className="py-2 font-normal">Nota</th>
                <th className="py-2 text-right font-normal">Marcados</th>
                <th className="py-2 text-right font-normal">Mesma história</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS.map((faixa) => {
                const daFaixa = respondidos.filter((p) => p.faixa === faixa);
                const mesmas = daFaixa.filter((p) => p.resposta === "mesma").length;
                return (
                  <tr key={faixa} className="border-b border-border/60">
                    <td className="py-2 text-text-secondary tabular-nums">{faixa}</td>
                    <td className="py-2 text-right text-text-muted tabular-nums">{numero(daFaixa.length)}</td>
                    <td className="py-2 text-right font-semibold text-foreground tabular-nums">{porcento(mesmas, daFaixa.length)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Link
            href="/relatorios/pares"
            className="w-fit rounded-md bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-colors hover:bg-accent"
          >
            Marcar pares
          </Link>
        </Painel>
        <Painel titulo="Temas e nomes mais seguidos" nota="Quantas pessoas seguem cada um (Temas).">
          <Barras itens={seguidos} />
        </Painel>
      </div>
    </div>
  );
}

function NumeroTexto({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <span className="text-[11px] text-text-muted">{rotulo}</span>
      <span className="text-[26px] leading-none font-extrabold tracking-tight text-foreground tabular-nums">{valor}</span>
      {detalhe && <span className="text-[11px] text-text-secondary">{detalhe}</span>}
    </div>
  );
}

function hostDe(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Painel({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-foreground uppercase">{titulo}</h2>
        {nota && <p className="mt-1 text-[12px] text-text-muted">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

function Vazio() {
  return <p className="text-[13px] text-text-muted">Nada no período.</p>;
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: number; detalhe?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <span className="text-[11px] text-text-muted">{rotulo}</span>
      <span className="text-[26px] leading-none font-extrabold tracking-tight text-foreground tabular-nums">{numero(valor)}</span>
      {detalhe && <span className="text-[11px] text-text-secondary">{detalhe}</span>}
    </div>
  );
}

/** Ranking: uma barra fina por item, valor na ponta, em cor única (uma
 * série só: o título já diz o que é). Nome e número em cor de texto. */
function Barras({ itens }: { itens: Item[] }) {
  if (itens.length === 0) return <Vazio />;
  const maior = Math.max(...itens.map((i) => i.total), 1);
  return (
    <ol className="flex flex-col gap-3">
      {itens.map((i) => (
        <li key={i.nome} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-text-secondary">{i.nome}</span>
            <span className="flex-shrink-0 text-text-muted tabular-nums">
              <span className="font-semibold text-foreground">{numero(i.total)}</span>
              {i.pessoas !== undefined && ` · ${numero(i.pessoas)} ${i.pessoas === 1 ? "pessoa" : "pessoas"}`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-r-[4px] bg-surface-hover">
            <div className="h-full rounded-r-[4px] bg-accent" style={{ width: `${Math.max(2, (i.total / maior) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Colunas por hora (0-23): rótulo só no pico; o resto no aviso ao passar
 * o mouse ou focar (teclado) e na tabela escondida pra leitor de tela. */
function Horarios({ horas }: { horas: { hora: number; total: number }[] }) {
  if (horas.length === 0) return <Vazio />;
  const porHora = new Map(horas.map((h) => [h.hora, h.total]));
  const dia = Array.from({ length: 24 }, (_, hora) => ({ hora, total: porHora.get(hora) ?? 0 }));
  const maior = Math.max(...dia.map((h) => h.total), 1);
  const pico = dia.reduce((a, b) => (b.total > a.total ? b : a));
  return (
    <div>
      <div className="flex h-32 items-end gap-[2px] border-b border-border" aria-hidden>
        {dia.map((h) => (
          <div key={h.hora} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            {h.hora === pico.hora && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-text-secondary tabular-nums">
                {numero(h.total)}
              </span>
            )}
            <div
              className="w-full max-w-[24px] rounded-t-[4px] bg-accent transition group-hover:brightness-125 group-focus:brightness-125"
              style={{ height: `${h.total === 0 ? 0 : Math.max(3, (h.total / maior) * 88)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border border-border bg-surface px-2 py-1 text-[11px] whitespace-nowrap shadow group-hover:block group-focus:block">
              <b className="text-foreground tabular-nums">{numero(h.total)}</b>{" "}
              <span className="text-text-muted">às {h.hora}h</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-text-muted tabular-nums" aria-hidden>
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
      <table className="sr-only">
        <caption>Notícias abertas por hora</caption>
        <tbody>
          {dia.map((h) => (
            <tr key={h.hora}>
              <th>{h.hora}h</th>
              <td>{h.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaFontes({ fontes, mostrarCatalogo = false }: { fontes: Fonte[]; mostrarCatalogo?: boolean }) {
  if (fontes.length === 0) return <Vazio />;
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border text-left text-[11px] text-text-muted">
          <th className="py-2 font-normal">Fonte</th>
          {mostrarCatalogo && <th className="py-2 font-normal">No catálogo</th>}
          <th className="py-2 text-right font-normal">Seguidores</th>
        </tr>
      </thead>
      <tbody>
        {fontes.map((f) => (
          <tr key={f.url} className="border-b border-border/60">
            <td className="max-w-0 py-2 pr-3">
              <span className="block truncate text-text-secondary" title={f.url}>
                {f.nome}
              </span>
              <span className="block truncate text-[11px] text-text-muted">{hostDe(f.url)}</span>
            </td>
            {mostrarCatalogo && (
              <td className="py-2 pr-3 text-[12px] text-text-muted">{f.na_vitrine ? "vitrine" : f.no_catalogo ? "sim" : "não"}</td>
            )}
            <td className="py-2 text-right font-semibold text-foreground tabular-nums">{numero(f.seguidores)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaBuscas({ buscas, comResultados = false }: { buscas: Busca[]; comResultados?: boolean }) {
  if (buscas.length === 0) return <Vazio />;
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border text-left text-[11px] text-text-muted">
          <th className="py-2 font-normal">Termo</th>
          <th className="py-2 font-normal">Onde</th>
          <th className="py-2 text-right font-normal">Pessoas</th>
          {comResultados && <th className="py-2 text-right font-normal">Resultados</th>}
        </tr>
      </thead>
      <tbody>
        {buscas.map((b) => (
          <tr key={`${b.termo}-${b.onde}`} className="border-b border-border/60">
            <td className="max-w-0 truncate py-2 pr-3 text-text-secondary">{b.termo}</td>
            <td className="py-2 pr-3 text-[12px] text-text-muted">{nomeDaOrigem(b.onde)}</td>
            <td className="py-2 text-right font-semibold text-foreground tabular-nums">{numero(b.pessoas)}</td>
            {comResultados && <td className="py-2 text-right text-text-muted tabular-nums">{numero(b.resultados ?? 0)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
