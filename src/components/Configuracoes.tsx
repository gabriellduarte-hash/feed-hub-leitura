"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { enviarFeedback, excluirConta, type TipoFeedback } from "@/app/actions/conta";
import {
  adicionarDestinatario,
  carregarResumo,
  removerDestinatario,
  salvarConfigResumo,
  type ConfigResumo,
  type Destinatario,
} from "@/app/actions/resumo";
import { mensagemDeErro } from "@/lib/erros-auth";
import { createClient } from "@/lib/supabase/client";
import { usePreferencias } from "@/lib/usePreferencias";
import type { Preferencias } from "@/lib/preferencias";
import { ApoiarProjeto } from "./ApoiarProjeto";
import { Icon, type NomeIcone } from "./Icon";
import type { Perfil } from "./Sidebar";
import { mostrarToast } from "./Toast";

/* Abrir de qualquer lugar: abrirConfiguracoes("perfil") */
const EVENTO = "feed:configuracoes";
export type Secao = "geral" | "aparencia" | "perfil" | "acesso" | "resumo" | "atalhos" | "feedback" | "apoiar";
export function abrirConfiguracoes(secao: Secao = "geral") {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: secao }));
}

/* Cores do avatar: o perfil guarda só o nome da cor */
export const CORES_AVATAR: Record<string, [string, string]> = {
  roxo: ["#7c4dff", "#d946ef"],
  azul: ["#2563eb", "#06b6d4"],
  verde: ["#059669", "#84cc16"],
  laranja: ["#ea580c", "#facc15"],
  rosa: ["#db2777", "#fb7185"],
  grafite: ["#334155", "#64748b"],
};
export function estiloAvatar(cor: string) {
  const [a, b] = CORES_AVATAR[cor] ?? CORES_AVATAR.roxo;
  return { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` };
}

const SECOES: { id: Secao; rotulo: string; icone: NomeIcone }[] = [
  { id: "geral", rotulo: "Geral", icone: "check" },
  { id: "aparencia", rotulo: "Aparência", icone: "sol" },
  { id: "perfil", rotulo: "Seu perfil", icone: "lapis" },
  { id: "acesso", rotulo: "Conta e acesso", icone: "link" },
  { id: "resumo", rotulo: "Resumo diário", icone: "enviar" },
  { id: "atalhos", rotulo: "Atalhos de teclado", icone: "comando" },
  { id: "feedback", rotulo: "Feedback", icone: "email" },
  { id: "apoiar", rotulo: "Apoiar o projeto", icone: "coracao" },
];

type Colecao = { id: string; nome: string };

export function Configuracoes({ email, perfil, colecoes }: { email: string; perfil: Perfil; colecoes: Colecao[] }) {
  const [secao, setSecao] = useState<Secao | null>(null);

  useEffect(() => {
    const aoAbrir = (e: Event) => setSecao((e as CustomEvent<Secao>).detail);
    window.addEventListener(EVENTO, aoAbrir);
    return () => window.removeEventListener(EVENTO, aoAbrir);
  }, []);

  useEffect(() => {
    if (!secao) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setSecao(null);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [secao]);

  if (!secao) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center md:p-4" role="dialog" aria-modal aria-label="Configurações">
      <div className="animate-aparece absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={() => setSecao(null)} />
      <div className="animate-menu-in relative flex h-full w-full max-w-[960px] flex-col overflow-hidden bg-surface md:h-[min(700px,92vh)] md:flex-row md:rounded-lg md:border md:border-border shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
        <nav className="flex flex-shrink-0 gap-0.5 overflow-x-auto border-b border-border bg-sidebar p-2 pr-14 md:w-[240px] md:flex-col md:overflow-visible md:border-r md:border-b-0 md:p-3">
          <div className="hidden px-3 pt-2 pb-4 text-[17px] font-bold tracking-tight text-foreground md:block">Configurações</div>
          {SECOES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSecao(s.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors md:gap-3 md:py-2.5 md:text-[14px] ${
                secao === s.id ? "bg-surface-active font-semibold text-foreground" : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon nome={s.icone} tamanho={18} />
              {s.rotulo}
            </button>
          ))}
        </nav>

        <div className="flex-grow overflow-y-auto px-5 py-7 md:px-10 md:py-9">
          <button
            type="button"
            onClick={() => setSecao(null)}
            aria-label="Fechar"
            className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-sidebar text-text-muted transition hover:bg-surface-hover hover:text-foreground md:top-5 md:right-5 md:bg-surface"
          >
            <Icon nome="fechar" />
          </button>
          <div key={secao} className="animate-fade-up flex max-w-[560px] flex-col gap-10">
            {secao === "geral" && <SecaoGeral />}
            {secao === "aparencia" && <SecaoAparencia />}
            {secao === "perfil" && <SecaoPerfil email={email} perfil={perfil} />}
            {secao === "acesso" && <SecaoAcesso />}
            {secao === "resumo" && <SecaoResumo email={email} colecoes={colecoes} />}
            {secao === "atalhos" && <SecaoAtalhos />}
            {secao === "feedback" && <SecaoFeedback />}
            {secao === "apoiar" && <ApoiarProjeto titulo="Apoie o Daily Paper" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- partes */

function Grupo({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{titulo}</h3>
        {descricao && <p className="mt-1 text-[13px] text-text-muted">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

function Opcoes<T extends string>({
  valor,
  opcoes,
  onChange,
}: {
  valor: T;
  opcoes: { valor: T; rotulo: string; detalhe?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {opcoes.map((o) => (
        <label key={o.valor} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-[14px] text-foreground">
          <input
            type="radio"
            checked={valor === o.valor}
            onChange={() => onChange(o.valor)}
            className="peer sr-only"
          />
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-text-muted transition peer-checked:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
            <span className={`h-2 w-2 rounded-full bg-accent transition-transform ${valor === o.valor ? "scale-100" : "scale-0"}`} />
          </span>
          {o.rotulo}
          {o.detalhe && <span className="text-xs text-text-muted">{o.detalhe}</span>}
        </label>
      ))}
    </div>
  );
}

function Chave({ ligado, onChange, rotulo, detalhe }: { ligado: boolean; onChange: (v: boolean) => void; rotulo: string; detalhe?: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => onChange(!ligado)} className="flex items-start justify-between gap-6 text-left">
      <span className="flex flex-col">
        <span className="text-[14px] text-foreground">{rotulo}</span>
        {detalhe && <span className="mt-0.5 text-[12px] text-text-muted">{detalhe}</span>}
      </span>
      <span className={`mt-0.5 flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${ligado ? "bg-accent" : "bg-surface-active"}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${ligado ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

const campo =
  "h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-accent/60 disabled:opacity-60";

function BotaoSalvar({ pendente, children }: { pendente?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pendente}
      className="h-10 w-fit rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-60"
    >
      {pendente ? "Salvando…" : children}
    </button>
  );
}

/* ---------------------------------------------------------------- seções */

function SecaoGeral() {
  const [p, alterar] = usePreferencias();
  return (
    <>
      <Grupo titulo="Leitura">
        <div className="flex flex-col gap-5">
          <Chave
            rotulo="Marcar como lida ao abrir"
            ligado={p.marcarLidoAoAbrir}
            onChange={(v) => alterar({ marcarLidoAoAbrir: v })}
          />
          <Chave
            rotulo="Esconder notícias já lidas"
            detalhe="Elas somem da lista na próxima vez que você abrir a página."
            ligado={p.esconderLidos}
            onChange={(v) => alterar({ esconderLidos: v })}
          />
          <Chave
            rotulo="Pedir confirmação antes de marcar tudo como lido"
            ligado={p.confirmarMarcarTudo}
            onChange={(v) => alterar({ confirmarMarcarTudo: v })}
          />
        </div>
      </Grupo>
      <p className="text-xs text-text-muted">Essas preferências valem só neste aparelho.</p>
    </>
  );
}

function SecaoAparencia() {
  const [p, alterar] = usePreferencias();
  return (
    <>
      <Grupo titulo="Tema">
        <Opcoes<Preferencias["tema"]>
          valor={p.tema}
          onChange={(tema) => alterar({ tema })}
          opcoes={[
            { valor: "claro", rotulo: "Claro" },
            { valor: "escuro", rotulo: "Escuro", detalhe: "padrão" },
            { valor: "sistema", rotulo: "Automático", detalhe: "igual ao do aparelho" },
          ]}
        />
      </Grupo>
      <Grupo titulo="Fonte do texto" descricao="Usada quando você abre uma notícia para ler.">
        <Opcoes<Preferencias["fonteLeitura"]>
          valor={p.fonteLeitura}
          onChange={(fonteLeitura) => alterar({ fonteLeitura })}
          opcoes={[
            { valor: "mono", rotulo: "JetBrains Mono", detalhe: "padrão" },
            { valor: "serifa", rotulo: "Merriweather", detalhe: "clássica, boa para textos longos" },
            { valor: "sans", rotulo: "Inter", detalhe: "moderna e limpa" },
          ]}
        />
      </Grupo>
      <Grupo titulo="Tamanho do texto">
        <Opcoes<Preferencias["tamanhoTexto"]>
          valor={p.tamanhoTexto}
          onChange={(tamanhoTexto) => alterar({ tamanhoTexto })}
          opcoes={[
            { valor: "p", rotulo: "Pequeno" },
            { valor: "m", rotulo: "Médio" },
            { valor: "g", rotulo: "Grande" },
            { valor: "gg", rotulo: "Extra grande" },
          ]}
        />
        <p className="rounded-md border border-border bg-background p-4 font-[family-name:var(--fonte-leitura)] text-[length:var(--tamanho-leitura)] leading-[1.8] text-foreground/90">
          É assim que o texto vai aparecer quando você abrir uma notícia.
        </p>
      </Grupo>
      <Grupo titulo="Espaçamento da lista">
        <Opcoes<Preferencias["densidade"]>
          valor={p.densidade}
          onChange={(densidade) => alterar({ densidade })}
          opcoes={[
            { valor: "compacta", rotulo: "Compacta", detalhe: "mais notícias na tela" },
            { valor: "confortavel", rotulo: "Confortável" },
            { valor: "espacosa", rotulo: "Espaçosa", detalhe: "capas maiores" },
          ]}
        />
      </Grupo>
    </>
  );
}

function SecaoPerfil({ email, perfil }: { email: string; perfil: Perfil }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [nome, setNome] = useState(perfil.nome);
  const [sobrenome, setSobrenome] = useState(perfil.sobrenome);
  const [cor, setCor] = useState(perfil.cor);
  const inicial = (nome || email).charAt(0).toUpperCase();

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await createClient().auth.updateUser({
        data: { nome: nome.trim(), sobrenome: sobrenome.trim(), cor },
      });
      if (error) {
        mostrarToast("Não foi possível salvar o perfil.");
        return;
      }
      mostrarToast("Perfil salvo");
      router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-8">
      <Grupo titulo="Foto do perfil" descricao="Sua inicial com a cor que você escolher.">
        <div className="flex items-center gap-5">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white transition-[background-image]"
            style={estiloAvatar(cor)}
          >
            {inicial}
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CORES_AVATAR).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                onClick={() => setCor(c)}
                style={estiloAvatar(c)}
                className={`h-8 w-8 rounded-full transition hover:scale-110 ${cor === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""}`}
              />
            ))}
          </div>
        </div>
      </Grupo>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} maxLength={60} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">Sobrenome</span>
          <input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} className={campo} maxLength={60} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-foreground">E-mail</span>
        <span className="text-[12px] text-text-muted">É o seu login e para onde vai o resumo diário.</span>
        <input value={email} disabled className={campo} />
      </label>
      <BotaoSalvar pendente={pendente}>Salvar</BotaoSalvar>
    </form>
  );
}

function SecaoAcesso() {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmacao) return setErro("As duas senhas não são iguais.");
    setErro(null);
    startTransition(async () => {
      const { error } = await createClient().auth.updateUser({ password: senha });
      if (error) return setErro(mensagemDeErro(error));
      setSenha("");
      setConfirmacao("");
      mostrarToast("Senha alterada");
    });
  }

  function sairDeTodos() {
    if (!window.confirm("Sair da sua conta em todos os aparelhos, inclusive este?")) return;
    startTransition(async () => {
      await createClient().auth.signOut({ scope: "global" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <>
      <Grupo titulo="Alterar senha">
        <form onSubmit={trocarSenha} className="flex flex-col gap-3">
          <input type="password" placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} autoComplete="new-password" />
          <input type="password" placeholder="Repita a nova senha" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={campo} autoComplete="new-password" />
          {erro && <p className="text-sm text-red-500">{erro}</p>}
          <BotaoSalvar pendente={pendente}>Alterar senha</BotaoSalvar>
        </form>
      </Grupo>
      <Grupo titulo="Aparelhos conectados" descricao="Entrou na sua conta num aparelho que não é seu? Saia de todos de uma vez.">
        <button
          type="button"
          onClick={sairDeTodos}
          className="h-10 w-fit rounded-lg border border-red-500/50 px-4 text-sm text-red-500 transition hover:bg-red-500/10"
        >
          Sair de todos os aparelhos
        </button>
      </Grupo>
      <ExcluirConta />
    </>
  );
}

function ExcluirConta() {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function excluir(e: React.FormEvent) {
    e.preventDefault();
    if (confirmacao.trim().toUpperCase() !== "EXCLUIR") return;
    startTransition(async () => {
      const r = await excluirConta();
      if (r.erro) return setErro(r.erro);
      router.push("/login?conta=excluida");
      router.refresh();
    });
  }

  return (
    <Grupo
      titulo="Excluir conta"
      descricao="Apaga sua conta e tudo o que está nela: coleções, fontes, notícias salvas e lidas, e o resumo diário. Não dá pra desfazer."
    >
      <form onSubmit={excluir} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          Para confirmar, digite EXCLUIR
          <input
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="off"
            className={campo}
          />
        </label>
        {erro && <p className="text-sm text-red-500">{erro}</p>}
        <button
          type="submit"
          disabled={pendente || confirmacao.trim().toUpperCase() !== "EXCLUIR"}
          className="h-10 w-fit rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
        >
          {pendente ? "Excluindo…" : "Excluir minha conta"}
        </button>
      </form>
    </Grupo>
  );
}

const TIPOS_FEEDBACK: { valor: TipoFeedback; rotulo: string }[] = [
  { valor: "sugestao", rotulo: "Sugestão" },
  { valor: "problema", rotulo: "Problema" },
  { valor: "elogio", rotulo: "Elogio" },
  { valor: "outro", rotulo: "Outro" },
];

function SecaoFeedback() {
  const [pendente, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoFeedback>("sugestao");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const r = await enviarFeedback(tipo, mensagem);
      if (r.erro) return setErro(r.erro);
      setMensagem("");
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <Grupo titulo="Obrigado!" descricao="Recebemos seu feedback. Se precisar, respondemos no seu e-mail.">
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="h-10 w-fit rounded-lg border border-border px-4 text-sm text-foreground transition hover:bg-surface-hover"
        >
          Mandar outro
        </button>
      </Grupo>
    );
  }

  return (
    <Grupo titulo="Feedback" descricao="Achou um problema, tem uma ideia ou quer contar o que achou? Sua mensagem vai direto pra quem faz o projeto.">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo">
          {TIPOS_FEEDBACK.map((t) => (
            <button
              key={t.valor}
              type="button"
              aria-pressed={tipo === t.valor}
              onClick={() => setTipo(t.valor)}
              className={`h-9 rounded-md border px-3.5 text-[13px] transition-colors ${
                tipo === t.valor
                  ? "border-foreground bg-foreground font-semibold text-background"
                  : "border-border text-text-secondary hover:border-accent hover:text-accent"
              }`}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={2000}
          rows={6}
          required
          placeholder="Escreva aqui…"
          className="resize-y rounded-lg border border-border bg-surface p-3.5 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-text-muted"
        />
        <div className="flex items-center gap-4">
          <BotaoSalvar pendente={pendente}>{pendente ? "Enviando…" : "Enviar"}</BotaoSalvar>
          <span className="text-xs text-text-muted">{mensagem.length}/2000</span>
        </div>
        {erro && <p className="text-sm text-red-500">{erro}</p>}
      </form>
    </Grupo>
  );
}

export function SecaoResumo({ email, colecoes }: { email: string; colecoes: Colecao[] }) {
  const [dados, setDados] = useState<{ config: ConfigResumo; destinatarios: Destinatario[]; limite: number } | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarResumo()
      .then((r) => ativo && setDados(r))
      .catch(() => ativo && setFalhou(true));
    return () => {
      ativo = false;
    };
  }, []);

  if (falhou) return <p className="text-sm text-red-500">Não foi possível carregar o resumo diário. Tente de novo.</p>;
  if (!dados) return <p className="animate-pulse text-sm text-text-muted">Carregando…</p>;
  return <FormResumo email={email} colecoes={colecoes} inicial={dados} />;
}

function FormResumo({
  email,
  colecoes,
  inicial,
}: {
  email: string;
  colecoes: Colecao[];
  inicial: { config: ConfigResumo; destinatarios: Destinatario[]; limite: number };
}) {
  const [config, setConfig] = useState(inicial.config);
  const [destinatarios, setDestinatarios] = useState(inicial.destinatarios);
  const [novoEmail, setNovoEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [salvando, startSalvar] = useTransition();
  const [mexendoLista, startLista] = useTransition();
  const todas = config.topicIds === null;

  function alternarColecao(id: string) {
    const atual = new Set(config.topicIds ?? []);
    if (atual.has(id)) atual.delete(id);
    else atual.add(id);
    setConfig({ ...config, topicIds: [...atual] });
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startSalvar(async () => {
      const r = await salvarConfigResumo(config);
      if (r.erro) setErro(r.erro);
      else mostrarToast("Resumo diário salvo");
    });
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErroLista(null);
    startLista(async () => {
      const r = await adicionarDestinatario(novoEmail);
      if (r.erro || !r.destinatario) return setErroLista(r.erro ?? "Não foi possível adicionar. Tente de novo.");
      setDestinatarios((d) => [...d, r.destinatario!]);
      setNovoEmail("");
    });
  }

  function remover(d: Destinatario) {
    startLista(async () => {
      const r = await removerDestinatario(d.id);
      if (r.erro) return setErroLista(r.erro);
      setDestinatarios((lista) => lista.filter((x) => x.id !== d.id));
    });
  }

  return (
    <>
      <form onSubmit={salvar} className="flex flex-col gap-8">
        <Grupo titulo="Resumo diário por e-mail" descricao="Um e-mail por dia com o que chegou desde o anterior: as 10 notícias mais recentes, resumidas, e mais algumas manchetes.">
          <Chave
            rotulo="Receber o resumo diário"
            ligado={config.ativo}
            onChange={(ativo) => setConfig({ ...config, ativo })}
          />
        </Grupo>

        <div className={`flex flex-col gap-8 transition-opacity ${config.ativo ? "" : "pointer-events-none opacity-40"}`}>
          <Grupo titulo="Horário de envio" descricao="Horário de Brasília. Pode chegar alguns minutos depois.">
            <select
              value={config.horaEnvio}
              onChange={(e) => setConfig({ ...config, horaEnvio: Number(e.target.value) })}
              className={`${campo} w-44`}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </Grupo>

          <Grupo titulo="O que entra no resumo">
            <Opcoes<"todas" | "escolher">
              valor={todas ? "todas" : "escolher"}
              onChange={(v) => setConfig({ ...config, topicIds: v === "todas" ? null : colecoes.map((c) => c.id) })}
              opcoes={[
                { valor: "todas", rotulo: "Todas as coleções" },
                { valor: "escolher", rotulo: "Só as que eu escolher" },
              ]}
            />
            {!todas && (
              <div className="animate-fade-up ml-7 flex flex-col gap-2">
                {colecoes.length === 0 && <span className="text-sm text-text-muted">Você ainda não tem coleções.</span>}
                {colecoes.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-3 text-[14px] text-foreground">
                    <input
                      type="checkbox"
                      checked={config.topicIds?.includes(c.id) ?? false}
                      onChange={() => alternarColecao(c.id)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    {c.nome}
                  </label>
                ))}
              </div>
            )}
          </Grupo>
        </div>

        <div className="flex items-center gap-4">
          <BotaoSalvar pendente={salvando}>Salvar</BotaoSalvar>
          {erro && <span className="text-sm text-red-500">{erro}</span>}
        </div>
      </form>

      <Grupo
        titulo="Quem recebe"
        descricao={`Você pode compartilhar o resumo com até ${inicial.limite} pessoas.`}
      >
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="truncate text-foreground">{email}</span>
            <span className="text-xs text-text-muted">você</span>
          </div>
          {destinatarios.map((d) => (
            <div key={d.id} className="animate-fade-up group flex items-center justify-between px-4 py-2.5 text-[14px]">
              <span className="truncate text-foreground">{d.email}</span>
              <button
                type="button"
                onClick={() => remover(d)}
                disabled={mexendoLista}
                aria-label={`Remover ${d.email}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-hover hover:text-red-500"
              >
                <Icon nome="lixeira" tamanho={16} />
              </button>
            </div>
          ))}
        </div>
        {destinatarios.length < inicial.limite ? (
          <form onSubmit={adicionar} className="flex gap-2">
            <input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={campo}
              required
            />
            <button
              type="submit"
              disabled={mexendoLista}
              className="h-11 flex-shrink-0 rounded-lg border border-border px-4 text-sm text-foreground transition hover:bg-surface-hover disabled:opacity-60"
            >
              Adicionar
            </button>
          </form>
        ) : (
          <p className="text-xs text-text-muted">Você já adicionou o máximo de {inicial.limite} pessoas.</p>
        )}
        {erroLista && <p className="text-sm text-red-500">{erroLista}</p>}
      </Grupo>
    </>
  );
}

const ATALHOS: [string, string][] = [
  ["j / k", "Próxima / anterior notícia"],
  ["m", "Marcar como lido / não lido"],
  ["s", "Ler mais tarde"],
  ["v", "Abrir o original numa nova aba"],
  ["Esc", "Fechar a notícia ou esta janela"],
  ["Ctrl K", "Ir para uma fonte, coleção ou página"],
];

function SecaoAtalhos() {
  return (
    <Grupo titulo="Atalhos de teclado" descricao="Funcionam nas listas de notícias e na leitura.">
      <div className="flex flex-col divide-y divide-border rounded-md border border-border">
        {ATALHOS.map(([tecla, acao]) => (
          <div key={tecla} className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-text-secondary">{acao}</span>
            <kbd className="rounded-md border border-border bg-background px-2 py-0.5 text-[12px] text-foreground">{tecla}</kbd>
          </div>
        ))}
      </div>
    </Grupo>
  );
}
