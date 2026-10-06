/** Dispara o workflow "Fonte nova" (.github/workflows/fonte-nova.yml do
 * repositório do coletor): coleta a fonte com o coletor completo (texto
 * inteiro, plano B) e já resume com a IA, sem esperar a coleta de hora
 * em hora.
 *
 * Opcional: precisa de duas variáveis de ambiente na Vercel. Sem elas,
 * não faz nada (a fonte já sai com as notícias coletadas pelo hub, só
 * sem o resumo da IA até a próxima coleta).
 *   GITHUB_ACTIONS_TOKEN  token "fine-grained" com permissão Actions: Read and write
 *                         só no repositório do coletor
 *   GITHUB_REPO_COLETOR   ex.: gabriellduarte-hash/feed-noticias-personalizado
 *
 * Devolve o que aconteceu, pra aparecer na tela e no log da Vercel: o
 * erro do GitHub sozinho não chega a lugar nenhum.
 */
export type ResultadoDisparo = { ok: boolean; motivo: string };

const EXPLICACAO: Record<number, string> = {
  401: "o GitHub recusou o token (inválido, vencido ou colado com espaço)",
  403: "o token não tem a permissão Actions: Read and write nesse repositório",
  404: "repositório ou workflow não encontrado: confira GITHUB_REPO_COLETOR (formato dono/repositório) e se o token dá acesso a esse repositório",
  422: "o GitHub não aceitou o pedido (o workflow precisa estar na branch main)",
};

export async function dispararColetaDaFonte(fonteId: string): Promise<ResultadoDisparo> {
  const token = process.env.GITHUB_ACTIONS_TOKEN?.trim();
  const repo = process.env.GITHUB_REPO_COLETOR?.trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/+$/, "");
  if (!token || !repo) {
    return { ok: false, motivo: "disparo automático não configurado (variáveis do GitHub ausentes na Vercel)" };
  }
  try {
    const resposta = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/fonte-nova.yml/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { fonte_id: fonteId } }),
      signal: AbortSignal.timeout(5000),
    });
    if (resposta.status === 204) return { ok: true, motivo: "coleta completa disparada no GitHub" };
    const corpo = (await resposta.text()).slice(0, 300);
    console.error(`[fonte-nova] GitHub respondeu ${resposta.status} para ${repo}: ${corpo}`);
    return { ok: false, motivo: `HTTP ${resposta.status}: ${EXPLICACAO[resposta.status] ?? corpo}` };
  } catch (erro) {
    console.error("[fonte-nova] falha ao chamar o GitHub:", erro);
    return { ok: false, motivo: `não foi possível falar com o GitHub (${(erro as Error).name})` };
  }
}
