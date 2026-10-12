import type { MetadataRoute } from "next";

/* Manifesto do app (/manifest.webmanifest): é o que permite instalar o
 * Daily Paper na tela inicial ou na área de trabalho (ConviteInstalar).
 * Ícones em public/icons, gerados a partir do app/icon.svg. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Paper",
    short_name: "Daily Paper",
    description: "As notícias das suas fontes, resumidas e num só lugar.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#0f0f0f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
