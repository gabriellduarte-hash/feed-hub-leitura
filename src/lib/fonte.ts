export function hostDe(url: string) {
  try {
    const u = new URL(url);
    // RSS de busca do Google Notícias (q=site:ge.globo.com): o site de
    // verdade é o da busca, não o news.google.com
    if (u.hostname === "news.google.com") {
      const site = u.searchParams.get("q")?.match(/site:([^\s/]+)/)?.[1];
      if (site) return site.replace(/^www\./, "");
    }
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function nomeDaFonte(nome: string | null, url: string) {
  return nome?.trim() || hostDe(url);
}

// Serviço público de favicons do Google: evita ter que baixar e guardar
// o ícone de cada site. O domínio do feed vai pro Google na requisição.
export function faviconDe(host: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}
