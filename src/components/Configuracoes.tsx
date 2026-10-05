"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePreferencias } from "@/lib/usePreferencias";
import type { Preferencias } from "@/lib/preferencias";
import { Icon, type NomeIcone } from "./Icon";
import type { Perfil } from "./Sidebar";
import { mostrarToast } from "./Toast";

/* Abrir de qualquer lugar: abrirConfiguracoes("perfil") */
const EVENTO = "feed:configuracoes";
export type Secao = "geral" | "aparencia" | "perfil" | "acesso" | "resumo" | "atalhos";
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
  { id: "acesso", rotulo: "Senha e acesso", icone: "link" },
  { id: "resumo", rotulo: "Resumo diário", icone: "enviar" },
  { id: "atalhos", rotulo: "Atalhos de teclado", icone: "comando" },
];

export function Configuracoes({ email, perfil }: { email: string; perfil: Perfil }) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal aria-label="Configurações">
      <div className="animate-aparece absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={() => setSecao(null)} />
      <div className="animate-menu-in relative flex h-[min(700px,92vh)] w-full max-w-[960px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <nav className="flex w-[240px] flex-shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar p-3">
          <div className="px-3 pt-2 pb-4 text-[17px] font-bold tracking-tight text-foreground">Configurações</div>
          {SECOES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSecao(s.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors ${
                secao === s.id ? "bg-accent-soft font-semibold text-accent" : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon nome={s.icone} tamanho={18} />
              {s.rotulo}
            </button>
          ))}
        </nav>

        <div className="relative flex-grow overflow-y-auto px-10 py-9">
          <button
            type="button"
            onClick={() => setSecao(null)}
            aria-label="Fechar"
            className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            <Icon nome="fechar" />
          </button>
          <div key={secao} className="animate-fade-up flex max-w-[560px] flex-col gap-10">
            {secao === "geral" && <SecaoGeral />}
            {secao === "aparencia" && <SecaoAparencia />}
            {secao === "perfil" && <SecaoPerfil email={email} perfil={perfil} />}
            {secao === "acesso" && <SecaoAcesso />}
            {secao === "resumo" && <SecaoResumo email={email} fechar={() => setSecao(null)} />}
            {secao === "atalhos" && <SecaoAtalhos />}
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
      className="h-10 w-fit rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
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
      <Grupo titulo="Leitura" descricao="Como os artigos se comportam quando você lê.">
        <div className="flex flex-col gap-5">
          <Chave
            rotulo="Marcar como lido ao abrir"
            detalhe="Abrir um artigo já conta como lido (como na Feedly)."
            ligado={p.marcarLidoAoAbrir}
            onChange={(v) => alterar({ marcarLidoAoAbrir: v })}
          />
          <Chave
            rotulo="Esconder artigos já lidos"
            detalhe="Os lidos somem da lista na próxima vez que ela carregar."
            ligado={p.esconderLidos}
            onChange={(v) => alterar({ esconderLidos: v })}
          />
          <Chave
            rotulo='Confirmar antes de "marcar tudo como lido"'
            ligado={p.confirmarMarcarTudo}
            onChange={(v) => alterar({ confirmarMarcarTudo: v })}
          />
        </div>
      </Grupo>
      <p className="text-xs text-text-muted">Essas preferências ficam salvas neste navegador.</p>
    </>
  );
}

function SecaoAparencia() {
  const [p, alterar] = usePreferencias();
  return (
    <>
      <Grupo titulo="Tema" descricao="Claro, escuro, ou acompanhar o sistema.">
        <Opcoes<Preferencias["tema"]>
          valor={p.tema}
          onChange={(tema) => alterar({ tema })}
          opcoes={[
            { valor: "sistema", rotulo: "Preferência do sistema" },
            { valor: "claro", rotulo: "Tema claro" },
            { valor: "escuro", rotulo: "Tema escuro" },
          ]}
        />
      </Grupo>
      <Grupo titulo="Fonte do texto" descricao="Usada no texto dos artigos, no painel de leitura.">
        <Opcoes<Preferencias["fonteLeitura"]>
          valor={p.fonteLeitura}
          onChange={(fonteLeitura) => alterar({ fonteLeitura })}
          opcoes={[
            { valor: "mono", rotulo: "JetBrains Mono", detalhe: "padrão" },
            { valor: "serifa", rotulo: "Merriweather", detalhe: "serifada, boa pra textos longos" },
            { valor: "sans", rotulo: "Inter", detalhe: "sem serifa" },
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
        <p className="rounded-xl border border-border bg-background p-4 font-[family-name:var(--fonte-leitura)] text-[length:var(--tamanho-leitura)] leading-[1.8] text-foreground/90">
          Assim fica o texto de um artigo aberto no painel de leitura.
        </p>
      </Grupo>
      <Grupo titulo="Densidade da lista" descricao="Espaço entre os artigos e tamanho da capa.">
        <Opcoes<Preferencias["densidade"]>
          valor={p.densidade}
          onChange={(densidade) => alterar({ densidade })}
          opcoes={[
            { valor: "compacta", rotulo: "Compacta", detalhe: "mais artigos na tela" },
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
      <div className="grid grid-cols-2 gap-4">
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
      if (error) return setErro(error.message);
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
      <Grupo titulo="Sessões" descricao="Se você entrou num computador que não é seu, encerre as sessões de todos os aparelhos.">
        <button
          type="button"
          onClick={sairDeTodos}
          className="h-10 w-fit rounded-lg border border-red-500/50 px-4 text-sm text-red-500 transition hover:bg-red-500/10"
        >
          Sair de todos os aparelhos
        </button>
      </Grupo>
    </>
  );
}

function SecaoResumo({ email, fechar }: { email: string; fechar: () => void }) {
  return (
    <Grupo
      titulo="Resumo diário por e-mail"
      descricao="Todo dia às 6h (horário de Brasília), a IA resume os artigos novos das suas fontes, agrupados por categoria."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-[13px] text-text-secondary">
        <span>
          Destinatário principal: <b className="text-foreground">{email}</b>
        </span>
        <span>Você pode mandar o mesmo resumo para até 10 pessoas.</span>
        <Link href="/compartilhar" onClick={fechar} className="w-fit text-accent hover:underline">
          Gerenciar destinatários →
        </Link>
      </div>
    </Grupo>
  );
}

const ATALHOS: [string, string][] = [
  ["j / k", "Próximo / anterior artigo"],
  ["m", "Marcar como lido / não lido"],
  ["s", "Ler mais tarde"],
  ["v", "Abrir o original numa nova aba"],
  ["Esc", "Fechar o painel ou esta janela"],
  ["Ctrl K", "Ir para… (buscar fonte, coleção ou página)"],
];

function SecaoAtalhos() {
  return (
    <Grupo titulo="Atalhos de teclado" descricao="Funcionam nas listas de artigos.">
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
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
