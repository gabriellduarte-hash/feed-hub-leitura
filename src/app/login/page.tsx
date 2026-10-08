import { ApoiarProjeto } from "@/components/ApoiarProjeto";
import { Icon, type NomeIcone } from "@/components/Icon";
import { BotaoEntrar, PainelEntrar } from "@/components/PainelEntrar";

/* Página de entrada (quem não entrou cai aqui): o que é o Feed de
 * Notícias, como funciona, perguntas frequentes e o apoio ao projeto.
 * Entrar e criar conta abrem numa janela, pelo topo ou pelos botões. */

const AVISOS: Record<string, { texto: string; modo: "entrar" | "esqueci" }> = {
  excluida: { texto: "Sua conta foi excluída. Se quiser voltar, é só criar uma nova.", modo: "entrar" },
  invalido: { texto: "Esse link expirou ou já foi usado. Peça outro aqui.", modo: "esqueci" },
};

const PASSOS: { titulo: string; texto: string }[] = [
  { titulo: "Siga suas fontes", texto: "Quase mil veículos do Brasil e de fora, por tema ou região. Ou cole o endereço de qualquer site: não precisa saber o que é RSS." },
  { titulo: "Organize em coleções", texto: "Agrupe as fontes por assunto. Cada coleção vira um feed só dela." },
  { titulo: "Leia sem distração", texto: "Cada notícia abre com um resumo e o texto completo, sem anúncios no meio." },
  { titulo: "Receba o resumo do dia", texto: "As notícias mais recentes no seu e-mail, no horário que você escolher." },
];

const RECURSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "globo", titulo: "Quase mil fontes", texto: "Veículos nacionais, regionais de todos os estados e internacionais." },
  { icone: "ia", titulo: "Resumo em português", texto: "Cada matéria ganha um resumo feito por IA, até as escritas em inglês." },
  { icone: "check", titulo: "Leitura limpa", texto: "Sem anúncios, pop-ups ou avisos de cookies no meio do texto." },
  { icone: "enviar", titulo: "Resumo por e-mail", texto: "As 10 notícias mais recentes do dia, e você pode compartilhar com até 10 pessoas." },
  { icone: "camadas", titulo: "Coleções", texto: "Acompanhe cada assunto separado: Tecnologia, Economia, sua cidade..." },
  { icone: "marcador", titulo: "Ler mais tarde", texto: "Guarde o que interessa e volte quando tiver tempo, no computador ou no celular." },
];

const PERGUNTAS: { pergunta: string; resposta: string }[] = [
  { pergunta: "É grátis?", resposta: "Sim. O projeto é independente, não tem anúncios e se mantém com o apoio de quem usa." },
  { pergunta: "Preciso saber o que é RSS?", resposta: "Não. Escolha as fontes na lista ou cole o endereço de um site; o Feed de Notícias descobre sozinho como ler as notícias dele." },
  { pergunta: "O resumo substitui a matéria?", resposta: "Não. Ele ajuda a decidir o que ler. O texto completo e o link para o site original estão sempre ali." },
  { pergunta: "O que vocês guardam sobre mim?", resposta: "Só o necessário: seu e-mail, as fontes que você segue e suas preferências. Você pode excluir a conta quando quiser, em Configurações." },
];

export default async function EntradaPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const aviso = AVISOS[String(params.conta ?? params.link ?? "")];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#topo" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
              <Icon nome="rss" tamanho={16} espessura={2.2} />
            </span>
            <span className="text-[14px] font-extrabold tracking-tight whitespace-nowrap">Feed de Notícias</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#como-funciona" className="hidden rounded-md px-3 py-2 text-[13px] text-text-secondary transition-colors hover:text-foreground md:block">
              Como funciona
            </a>
            <a href="#apoiar" className="hidden rounded-md px-3 py-2 text-[13px] text-text-secondary transition-colors hover:text-foreground md:block">
              Apoiar
            </a>
            <BotaoEntrar
              modo="entrar"
              className="h-9 rounded-md border border-border px-3.5 text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:border-transparent"
            >
              Entrar
            </BotaoEntrar>
            {/* no celular, "Criar conta grátis" já está em destaque logo abaixo */}
            <BotaoEntrar
              modo="criar"
              className="hidden h-9 rounded-md bg-foreground px-3.5 text-[13px] font-semibold whitespace-nowrap text-background transition-colors hover:bg-accent sm:block"
            >
              Criar conta
            </BotaoEntrar>
          </nav>
        </div>
      </header>

      <main id="topo">
        {/* abertura */}
        <section className="mx-auto grid max-w-[1080px] items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div className="animate-fade-up flex flex-col gap-6">
            <p className="text-[11px] font-bold tracking-[0.2em] text-text-muted uppercase">
              <span className="text-accent">●</span>&nbsp; Leitor de notícias com resumo por IA
            </p>
            <h1 className="text-[34px] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-[46px]">
              Suas notícias, resumidas e num só lugar.
            </h1>
            <p className="max-w-[520px] text-[15px] leading-relaxed text-text-secondary">
              Siga os sites que você lê, do Brasil e de fora. O Feed de Notícias junta tudo, tira os anúncios e resume cada
              matéria em português. Uma vez por dia, o mais recente chega no seu e-mail.
            </p>
            <div className="flex flex-wrap gap-3">
              <BotaoEntrar
                modo="criar"
                className="h-12 rounded-lg bg-foreground px-6 text-[14px] font-bold text-background transition-colors hover:bg-accent active:scale-[0.98]"
              >
                Criar conta grátis
              </BotaoEntrar>
              <BotaoEntrar
                modo="entrar"
                className="h-12 rounded-lg border border-border px-6 text-[14px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Já tenho conta
              </BotaoEntrar>
            </div>
          </div>
          <ExemploDeNoticia />
        </section>

        {/* como funciona */}
        <section id="como-funciona" className="scroll-mt-16 border-t border-border bg-surface">
          <div className="mx-auto max-w-[1080px] px-4 py-20 sm:px-6">
            <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">Como funciona</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="flex flex-col gap-2 border-t-2 border-foreground pt-4">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-accent">PASSO {i + 1}</span>
                  <span className="text-[16px] font-extrabold">{p.titulo}</span>
                  <span className="text-[13px] leading-relaxed text-text-secondary">{p.texto}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* recursos */}
        <section className="mx-auto max-w-[1080px] px-4 py-20 sm:px-6">
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">O que você encontra aqui</h2>
          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((r) => (
              <div key={r.titulo} className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Icon nome={r.icone} tamanho={19} />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-extrabold">{r.titulo}</span>
                  <span className="text-[13px] leading-relaxed text-text-secondary">{r.texto}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* perguntas */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-[760px] px-4 py-20 sm:px-6">
            <h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">Perguntas frequentes</h2>
            <div className="mt-8 flex flex-col divide-y divide-border border-y border-border">
              {PERGUNTAS.map((p) => (
                <details key={p.pergunta} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold">
                    {p.pergunta}
                    <Icon nome="chevronBaixo" tamanho={18} className="flex-shrink-0 text-text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">{p.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* apoiar */}
        <section id="apoiar" className="scroll-mt-16 mx-auto max-w-[640px] px-4 py-20 sm:px-6">
          <ApoiarProjeto titulo="Gostou da ideia?" />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-3 px-4 py-8 text-[12px] text-text-muted sm:flex-row sm:px-6">
          <span>Feed de Notícias · projeto independente, sem anúncios</span>
          <BotaoEntrar modo="entrar" className="font-semibold text-foreground hover:text-accent">
            Entrar
          </BotaoEntrar>
        </div>
      </footer>

      <PainelEntrar aviso={aviso} />
    </div>
  );
}

/* Uma notícia como aparece no leitor, pra mostrar o produto. */
function ExemploDeNoticia() {
  return (
    <div className="animate-fade-up relative hidden md:block" aria-hidden>
      <div className="absolute -top-4 -right-4 h-full w-full rounded-xl border border-border bg-surface-active" />
      <div className="relative flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-accent">#tecnologia</span>
          <span className="font-semibold text-text-secondary">Tecnoblog</span>
          <span className="text-text-muted">· 2h</span>
        </div>
        <p className="text-[19px] leading-snug font-extrabold">Nova geração de chips promete dobrar a bateria dos celulares em 2027</p>
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
          <Icon nome="ia" tamanho={14} className="text-accent" />
          Resumo
        </div>
        <p className="text-[13px] leading-[1.8] text-text-secondary">
          A fabricante anunciou chips <b className="text-foreground">40% mais eficientes</b>, previstos para os celulares lançados a
          partir de <b className="text-foreground">março de 2027</b>.
        </p>
        <p className="border-l-2 border-accent pl-3 text-[13px] leading-[1.7] text-foreground italic">
          “É o maior salto de eficiência da década” — diretora de engenharia
        </p>
      </div>
    </div>
  );
}
