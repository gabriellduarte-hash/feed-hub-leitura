import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-technical",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Feed de Notícias",
  description: "Seus tópicos, organizados num só lugar.",
};

// Roda antes da primeira pintura: quem escolheu o tema claro não vê a
// tela piscar em escuro enquanto o React carrega.
const SCRIPT_TEMA = `try{if(localStorage.getItem("tema")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Escuro por padrão (como a Feedly); o ThemeToggle troca pra claro se
  // o usuário escolheu isso antes (localStorage).
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        {children}
      </body>
    </html>
  );
}
