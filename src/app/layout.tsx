import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fonte variável: sem "weight", vem o eixo inteiro (100–800) + itálico
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-technical",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feed de Notícias",
  description: "Seus tópicos, organizados num só lugar.",
};

// Roda antes da primeira pintura: quem escolheu o tema claro não vê a
// tela piscar em escuro enquanto o React carrega.
const SCRIPT_TEMA = `try{if(localStorage.getItem("tema")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        {children}
      </body>
    </html>
  );
}
