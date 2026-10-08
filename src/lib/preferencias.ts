/** Preferências do hub (Configurações). Ficam no localStorage do navegador:
 * são do aparelho, como o tema, e aplicam antes da página aparecer. */
export type Preferencias = {
  tema: "sistema" | "claro" | "escuro";
  fonteLeitura: "mono" | "serifa" | "sans";
  tamanhoTexto: "p" | "m" | "g" | "gg";
  densidade: "compacta" | "confortavel" | "espacosa";
  marcarLidoAoAbrir: boolean;
  esconderLidos: boolean;
  confirmarMarcarTudo: boolean;
};

export const PADRAO: Preferencias = {
  tema: "escuro",
  fonteLeitura: "mono",
  tamanhoTexto: "m",
  densidade: "confortavel",
  marcarLidoAoAbrir: true,
  esconderLidos: false,
  confirmarMarcarTudo: true,
};

export const CHAVE = "preferencias";

// Versão 2 (08/10/2026): o padrão passou a ser o tema escuro. Antes disso
// as preferências eram salvas inteiras, com o "claro" do padrão antigo
// junto, mesmo sem a pessoa ter escolhido. Por isso o tema salvo antes da
// versão 2 é ignorado uma vez; o que for escolhido depois vale.
export const VERSAO = 2;

export function lerPreferencias(texto: string | null): Preferencias {
  try {
    const salvas = (texto ? JSON.parse(texto) : {}) as Partial<Preferencias> & { v?: number };
    if (salvas.v !== VERSAO) delete salvas.tema;
    return { ...PADRAO, ...salvas };
  } catch {
    return PADRAO;
  }
}

/** Atributos no <html> que o CSS usa (globals.css). Mesma lógica do script abaixo. */
export function aplicarNoDocumento(p: Preferencias) {
  const html = document.documentElement;
  const escuro = p.tema === "escuro" || (p.tema === "sistema" && matchMedia("(prefers-color-scheme: dark)").matches);
  html.dataset.theme = escuro ? "dark" : "light";
  html.dataset.fonte = p.fonteLeitura;
  html.dataset.tamanho = p.tamanhoTexto;
  html.dataset.densidade = p.densidade;
}

// Versão em texto de lerPreferencias + aplicarNoDocumento, pra rodar
// inline antes do React.
export const SCRIPT_PREFERENCIAS = `try{var p=JSON.parse(localStorage.getItem("${CHAVE}")||"null")||{};if(p.v!==${VERSAO})delete p.tema;var h=document.documentElement,m=p.tema||"${PADRAO.tema}";h.dataset.theme=(m==="escuro"||(m==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches))?"dark":"light";h.dataset.fonte=p.fonteLeitura||"${PADRAO.fonteLeitura}";h.dataset.tamanho=p.tamanhoTexto||"${PADRAO.tamanhoTexto}";h.dataset.densidade=p.densidade||"${PADRAO.densidade}"}catch(e){}`;
