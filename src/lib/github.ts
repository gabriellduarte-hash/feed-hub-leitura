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
 */
export async function dispararColetaDaFonte(fonteId: string): Promise<boolean> {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  const repo = process.env.GITHUB_REPO_COLETOR;
  if (!token || !repo) return false;
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
    return resposta.status === 204;
  } catch {
    return false;
  }
}
