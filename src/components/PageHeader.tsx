import Link from "next/link";

export function PageHeader({
  titulo,
  sobretitulo,
  subtitulo,
  acoes,
}: {
  titulo: string;
  sobretitulo?: string;
  subtitulo?: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6 pt-10 pb-8">
      <div className="flex min-w-0 flex-col">
        {sobretitulo && (
          <div className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">{sobretitulo}</div>
        )}
        <h1 className="truncate text-[28px] leading-tight font-bold tracking-tight text-foreground">{titulo}</h1>
        {subtitulo && <div className="mt-2 text-[13px] text-text-secondary">{subtitulo}</div>}
      </div>
      {acoes && <div className="flex flex-shrink-0 items-center gap-1 pt-1.5">{acoes}</div>}
    </header>
  );
}

export function Tabs({
  abas,
  ativa,
}: {
  abas: { rotulo: string; href: string; chave: string }[];
  ativa: string;
}) {
  return (
    <nav className="-mt-2 mb-10 flex gap-7 border-b border-border">
      {abas.map((aba) => (
        <Link
          key={aba.chave}
          href={aba.href}
          className={`relative pb-2.5 text-[14px] transition-colors ${
            aba.chave === ativa
              ? "font-semibold text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          {aba.rotulo}
        </Link>
      ))}
    </nav>
  );
}
