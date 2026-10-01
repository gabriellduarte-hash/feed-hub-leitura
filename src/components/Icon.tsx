const PATHS = {
  hoje: <path d="M12 2.5 21.5 12 12 21.5 2.5 12z M8 12h8 M12 8v8" />,
  rss: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9 M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  marcador: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  relogio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lista: <path d="M3 6h3 M3 12h3 M3 18h3 M9 6h12 M9 12h12 M9 18h12" />,
  chevronBaixo: <path d="m6 9 6 6 6-6" />,
  chevronDireita: <path d="m9 6 6 6-6 6" />,
  chevronEsquerda: <path d="m15 6-6 6 6 6" />,
  mais: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  adicionar: <path d="M12 5v14 M5 12h14" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  atualizar: <path d="M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5" />,
  fechar: <path d="M6 6l12 12 M18 6 6 18" />,
  coracao: (
    <path d="M12 20s-7-4.4-9-9A4.8 4.8 0 0 1 12 6.5 4.8 4.8 0 0 1 21 11c-2 4.6-9 9-9 9z" />
  ),
  link: (
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1 M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  enviar: <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" />,
  compartilhar: <path d="M14 5l7 7-7 7 M21 12H10a7 7 0 0 0-7 7" />,
  externo: <path d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  painel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  tendencia: <path d="M3 17l6-6 4 4 8-8 M15 7h6v6" />,
  lapis: <path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" />,
  lixeira: <path d="M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3" />,
  mover: <path d="M7 4v16 M3 8l4-4 4 4 M17 20V4 M13 16l4 4 4-4" />,
  semelhantes: (
    <>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </>
  ),
  organizar: <path d="M4 6h16 M4 12h10 M4 18h6" />,
  sair: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />,
  bussola: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  ia: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 16l2.5-8 2.5 8 M8.3 13.5h3.4 M16 8v8" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18" />
    </>
  ),
} as const;

export type NomeIcone = keyof typeof PATHS;

export function Icon({
  nome,
  tamanho = 18,
  className,
  preenchido = false,
  espessura = 1.7,
}: {
  nome: NomeIcone;
  tamanho?: number;
  className?: string;
  preenchido?: boolean;
  espessura?: number;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[nome]}
    </svg>
  );
}
