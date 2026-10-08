import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Merriweather } from "next/font/google";
import { SCRIPT_PREFERENCIAS } from "@/lib/preferencias";
import "./globals.css";

// Fonte variável: sem "weight", vem o eixo inteiro (100–800) + itálico
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-technical",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Opções de fonte do texto dos artigos (Preferências > Aparência).
// preload: false — só são baixadas se a pessoa escolher uma delas.
const merriweather = Merriweather({
  variable: "--font-serifa",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});
const inter = Inter({ variable: "--font-sans-leitura", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Daily Paper",
  description: "As notícias das suas fontes, resumidas e num só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${jetBrainsMono.variable} ${merriweather.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Aplica tema/fonte/tamanho/densidade antes da primeira pintura */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PREFERENCIAS }} />
        {children}
      </body>
    </html>
  );
}
