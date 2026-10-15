import { createClient } from "@/lib/supabase/server";
import { hostDe, nomeDaFonte } from "@/lib/fonte";
import { AppShell } from "@/components/AppShell";
import { ehAdmin } from "@/lib/admin";
import type { ColecaoSidebar } from "@/components/Sidebar";
import type { ItemSeguido } from "@/lib/seguir";

type TopicoComFontes = {
  id: string;
  name: string;
  sources: { id: string; name: string | null; url: string; favorite: boolean; topic_id: string }[];
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: topicos },
    { data: contagens },
    { data: seguindo },
    { data: contagemTemas },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("topics")
      .select("id, name, sources(id, name, url, favorite, topic_id)")
      .order("created_at"),
    // novas de hoje que a pessoa ainda não leu (sql/045): sobe a cada
    // coleta, desce ao ler e zera à meia-noite (Brasília)
    supabase.from("novas_por_fonte").select("source_id, novas"),
    // temas e nomes seguidos (sql/045); sem a tabela, vem vazio
    supabase.from("seguindo").select("tipo, chave, rotulo").order("criado_em"),
    // histórias de hoje de cada tema seguido (sql/046), o número do menu
    supabase.rpc("contagem_seguidos"),
  ]);

  const novasPorFonte = new Map((contagens ?? []).map((c) => [c.source_id as string, c.novas as number]));

  const colecoes: ColecaoSidebar[] = ((topicos ?? []) as TopicoComFontes[]).map((t) => {
    const fontes = t.sources
      .map((s) => ({
        id: s.id,
        nome: nomeDaFonte(s.name, s.url),
        host: hostDe(s.url),
        novas: novasPorFonte.get(s.id) ?? 0,
        favorita: s.favorite,
        topicoId: s.topic_id,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return {
      id: t.id,
      nome: t.name,
      novas: fontes.reduce((soma, f) => soma + f.novas, 0),
      fontes,
    };
  });

  return (
    <AppShell
      dados={{
        colecoes,
        totalNovas: colecoes.reduce((soma, c) => soma + c.novas, 0),
        email: user?.email ?? "",
        admin: ehAdmin(user?.email),
        seguindo: (seguindo ?? []) as ItemSeguido[],
        contagemTemas: Object.fromEntries(
          ((contagemTemas ?? []) as { tipo: string; chave: string; noticias: number }[]).map((c) => [
            `${c.tipo}:${c.chave}`,
            c.noticias,
          ]),
        ),
        // nome/sobrenome/cor ficam nos metadados do usuário (Supabase Auth),
        // editados em Configurações > Perfil
        perfil: {
          nome: String(user?.user_metadata?.nome ?? ""),
          sobrenome: String(user?.user_metadata?.sobrenome ?? ""),
          cor: String(user?.user_metadata?.cor ?? "roxo"),
          boasVindasVista: Boolean(user?.user_metadata?.boas_vindas_vista),
        },
      }}
    >
      {children}
    </AppShell>
  );
}
