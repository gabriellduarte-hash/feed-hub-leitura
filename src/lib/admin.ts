/** Quem vê a página Relatórios: os e-mails em ADMIN_EMAILS (Vercel),
 * separados por vírgula. Sem a variável, ninguém vê. Fica fora do código
 * pra o e-mail de ninguém ir parar no repositório. */
export function ehAdmin(email: string | null | undefined) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
