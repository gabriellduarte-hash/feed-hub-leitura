import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Política de privacidade · Daily Paper",
  description: "Quais dados o Daily Paper guarda, para quê, com quem eles passam e como você controla tudo isso.",
};

/* Página aberta (sem login): a política de privacidade. O Google pede o
 * link no consentimento do "Continuar com Google". Ao mudar o que o
 * Daily Paper guarda ou com quem compartilha, mudar aqui e a data. */

const ATUALIZADA_EM = "15 de outubro de 2026";
const CONTATO = "feeddailypaper@gmail.com";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-[720px] flex-col gap-10">
        <Link href="/" aria-label="Daily Paper" className="w-fit">
          <Logo className="text-[18px]" />
        </Link>

        <header className="flex flex-col gap-3">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight sm:text-[34px]">Política de privacidade</h1>
          <p className="text-[13px] text-text-muted">Atualizada em {ATUALIZADA_EM}</p>
          <p className="text-[15px] leading-relaxed text-text-secondary">
            O Daily Paper é um leitor de notícias independente e sem anúncios. Esta página explica quais dados guardamos,
            para quê, com quem eles passam e como você controla tudo isso. Vale para o site dailypaper.news, o app
            instalado no celular e os e-mails do Daily Paper.
          </p>
        </header>

        <Secao titulo="O que guardamos">
          <Lista
            itens={[
              <>
                <b>Sua conta:</b> e-mail e senha (a senha fica cifrada pelo serviço de login e ninguém do Daily Paper a vê),
                além do nome, sobrenome e cor do avatar que você escolher. Se você entrar com o Google, recebemos o nome, o
                e-mail e a foto da sua conta Google; usamos só o nome e o e-mail.
              </>,
              <>
                <b>O que você segue:</b> fontes, coleções, temas e nomes.
              </>,
              <>
                <b>Sua leitura:</b> as notícias que você abriu ou marcou como lidas e as que salvou em Ler mais tarde.
              </>,
              <>
                <b>Resumo por e-mail:</b> se está ligado, o horário, as coleções escolhidas e os e-mails das pessoas com quem
                você compartilha (até 10).
              </>,
              <>
                <b>Estatísticas de uso:</b> quando você abre uma notícia (o site e a categoria dela), o que busca e quantos
                resultados vieram, e quando segue ou deixa de seguir uma fonte. Só usamos somadas, para decidir o que entra
                no catálogo: ninguém aparece individualmente nos relatórios. São apagadas depois de 90 dias.
              </>,
              <>
                <b>Mensagens de feedback:</b> o que você escreve e o seu e-mail, para podermos responder.
              </>,
            ]}
          />
          <p>
            Não guardamos dados de pagamento (o apoio por PIX vai direto pelo seu banco), localização, contatos nem o que
            você faz fora do Daily Paper.
          </p>
        </Secao>

        <Secao titulo="Para que usamos">
          <Lista
            itens={[
              "Montar o seu feed, os contadores, os temas e o resumo por e-mail.",
              "Entrar na sua conta e mantê-la segura.",
              "Enviar os e-mails que você pediu: resumo diário, confirmação de conta, troca de senha e boas-vindas.",
              "Melhorar o produto com as estatísticas somadas.",
            ]}
          />
          <p>Não vendemos dados, não mostramos anúncios e não usamos os seus dados para publicidade.</p>
        </Secao>

        <Secao titulo="Com quem os dados passam">
          <p>Usamos alguns serviços para o Daily Paper funcionar. Eles tratam os dados só para prestar esse serviço:</p>
          <Lista
            itens={[
              <>
                <b>Supabase:</b> banco de dados e login (conta, preferências, leitura).
              </>,
              <>
                <b>Vercel:</b> hospeda o site.
              </>,
              <>
                <b>Resend:</b> envia os e-mails.
              </>,
              <>
                <b>Google:</b> confirma quem você é, se você usar &quot;Continuar com Google&quot;. A IA do Google (Gemini)
                recebe o texto das notícias escolhidas para o seu resumo, que é público, e nunca dados seus.
              </>,
              <>
                <b>GitHub:</b> roda a coleta das notícias; não recebe dados seus.
              </>,
            ]}
          />
          <p>Alguns desses serviços guardam os dados fora do Brasil, principalmente nos Estados Unidos.</p>
        </Secao>

        <Secao titulo="Cookies e o seu navegador">
          <Lista
            itens={[
              "Um cookie de sessão, para manter você conectado. Não há cookies de anúncio nem de rastreamento de terceiros.",
              "Preferências como o tema, o menu recolhido e “esconder lidas” ficam no seu navegador e não são enviadas para nós.",
            ]}
          />
        </Secao>

        <Secao titulo="Seus direitos">
          <p>Pela Lei Geral de Proteção de Dados (LGPD), você pode, a qualquer momento:</p>
          <Lista
            itens={[
              "ver e corrigir os seus dados, em Configurações › Seu perfil;",
              "excluir a conta e tudo o que está ligado a ela, em Configurações › Conta e acesso › Excluir conta (é na hora);",
              "desligar o resumo por e-mail, em Configurações › Resumo diário;",
              <>
                pedir uma cópia dos seus dados ou tirar dúvidas pelo e-mail <Email />.
              </>,
            ]}
          />
        </Secao>

        <Secao titulo="Por quanto tempo">
          <Lista
            itens={[
              "Os dados da conta ficam enquanto ela existir. Ao excluir a conta, apagamos também as fontes, as leituras, os temas e os resumos.",
              "As estatísticas de uso ficam 90 dias.",
              "As notícias coletadas são públicas (vêm dos próprios sites) e ficam guardadas por um tempo para o feed funcionar.",
            ]}
          />
        </Secao>

        <Secao titulo="Segurança">
          <p>
            A conexão é sempre cifrada (HTTPS), cada pessoa só tem acesso aos próprios dados (regras no próprio banco de
            dados) e as senhas nunca ficam guardadas como texto.
          </p>
        </Secao>

        <Secao titulo="Crianças">
          <p>O Daily Paper não é feito para menores de 13 anos.</p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Se esta política mudar, a data lá em cima muda junto. Mudanças importantes também são avisadas por e-mail.
          </p>
        </Secao>

        <Secao titulo="Contato">
          <p>
            Dúvidas, pedidos ou reclamações sobre os seus dados: <Email />.
          </p>
        </Secao>

        <footer className="border-t border-border pt-6 text-[12px] text-text-muted">
          <Link href="/" className="hover:text-accent">
            Voltar ao Daily Paper
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-[15px] leading-relaxed text-text-secondary">
      <h2 className="text-[18px] font-bold tracking-tight text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="text-accent">—</span>
          <span className="[&_b]:font-semibold [&_b]:text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Email() {
  return (
    <a href={`mailto:${CONTATO}`} className="font-semibold text-foreground underline underline-offset-2 hover:text-accent">
      {CONTATO}
    </a>
  );
}
