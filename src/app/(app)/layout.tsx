import { createClient } from "@/lib/supabase/server";
import { hostDe, nomeDaFonte } from "@/lib/fonte";
import { AppShell } from "@/components/AppShell";
import type { ColecaoSidebar } from "@/components/Sidebar";

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
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("topics")
      .select("id, name, sources(id, name, url, favorite, topic_id)")
      .order("created_at"),
    // "novas desde a última visita" (sql/038): zera ao abrir a fonte, a
    // coleção ou o feed todo (RegistrarVisita)
    supabase.from("novas_por_fonte").select("source_id, novas"),
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
