export function hostDe(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
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
