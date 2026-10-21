import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cabeçalhos de segurança em todas as páginas (auditoria de 20/10)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nenhum outro site pode abrir o hub dentro de um <iframe>: sem
          // isso, uma página poderia pôr o hub invisível por cima de um
          // botão dela e fazer a pessoa clicar em "deixar de seguir" ou
          // "excluir" sem saber (clickjacking). O X-Frame-Options é o
          // mesmo aviso, pros navegadores antigos.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          // O navegador não "adivinha" o tipo de um arquivo
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Link pra fora leva só o domínio (dailypaper.news), não a página
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
