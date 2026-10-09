/* Marca Daily Paper: {daily paper} em JetBrains Mono negrito, com as
 * chaves no roxo da identidade. As chaves sozinhas, {}, são a logo
 * reduzida (ícone do app, menu recolhido, aba do meio no celular). O
 * favicon (app/icon.svg) desenha as mesmas chaves em SVG, porque a aba do
 * navegador não carrega a fonte. */

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight whitespace-nowrap text-foreground ${className}`}>
      <span className="sr-only">Daily Paper</span>
      <span aria-hidden>
        <span className="text-accent">{"{"}</span>daily paper<span className="text-accent">{"}"}</span>
      </span>
    </span>
  );
}

/** {} num quadrado preto, igual ao favicon nos dois temas (a borda clara
 * só aparece no escuro, pra o quadrado não sumir no fundo).
 * tamanho em px (lado do quadrado). espacada: "{  }" num retângulo mais
 * largo e mais grosso (o JetBrains Mono não passa do 800, então um
 * contorno fino engrossa o traço); é a aba do meio no celular. */
export function LogoReduzida({
  tamanho = 32,
  espacada = false,
  className = "",
}: {
  tamanho?: number;
  espacada?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={
        espacada
          ? { height: tamanho, paddingInline: Math.round(tamanho * 0.22), fontSize: Math.round(tamanho * 0.62) }
          : { width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.5) }
      }
      className={`flex flex-shrink-0 items-center justify-center rounded-md border border-white/15 bg-[#121212] leading-none font-extrabold text-accent ${
        espacada ? "whitespace-pre [-webkit-text-stroke:0.5px_currentColor]" : "tracking-[-0.08em]"
      } ${className}`}
    >
      {espacada ? "{  }" : "{}"}
    </span>
  );
}
