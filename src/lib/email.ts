/** Só pro servidor (server actions): usa senhas e chaves secretas.
 *
 * Dois jeitos de enviar, nessa ordem:
 *  1. SMTP (SMTP_USER + SMTP_PASSWORD na Vercel): no período de testes, o
 *     Gmail do projeto com uma senha de app. Envia como esse Gmail, pra
 *     qualquer pessoa (o Gmail aceita algumas centenas de e-mails por dia).
 *  2. Resend (RESEND_API_KEY): enquanto não houver domínio verificado no
 *     Resend, o remetente é onboarding@resend.dev e ele só entrega pro
 *     e-mail da própria conta Resend. Com o domínio, volta a ser o caminho
 *     principal: é só tirar as variáveis de SMTP.
 * Sem nenhum dos dois, não envia e devolve false (quem chama decide). */

import nodemailer from "nodemailer";

const REMETENTE_RESEND = "Daily Paper <onboarding@resend.dev>";
export const URL_DO_HUB = "https://feed-hub-leitura.vercel.app";

type Email = { para: string; assunto: string; html: string; responderPara?: string };

async function enviarPorSmtp(email: Email, usuario: string, senha: string) {
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: usuario, pass: senha },
  });
  await transporte.sendMail({
    from: `Daily Paper <${usuario}>`,
    to: email.para,
    subject: email.assunto,
    html: email.html,
    replyTo: email.responderPara,
  });
}

export async function enviarEmail(email: Email) {
  const usuarioSmtp = process.env.SMTP_USER?.trim();
  const senhaSmtp = process.env.SMTP_PASSWORD?.replace(/\s+/g, ""); // a senha de app do Google vem com espaços
  if (usuarioSmtp && senhaSmtp) {
    try {
      await enviarPorSmtp(email, usuarioSmtp, senhaSmtp);
      return true;
    } catch (erro) {
      console.error("[email] falha no SMTP:", erro);
      return false;
    }
  }

  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) {
    console.warn("[email] sem RESEND_API_KEY: e-mail não enviado");
    return false;
  }
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: REMETENTE_RESEND,
        to: [email.para],
        subject: email.assunto,
        html: email.html,
        ...(email.responderPara ? { reply_to: email.responderPara } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resposta.ok) {
      console.error(`[email] Resend respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[email] falha ao chamar o Resend:", erro);
    return false;
  }
}

export function esc(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const FONTE = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

/** Moldura dos e-mails do hub: a mesma identidade do resumo diário. */
function moldura(titulo: string, corpo: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700;800&display=swap" rel="stylesheet">
<title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f3f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f3f0;">
<tr><td align="center" style="padding:32px 16px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 0 24px;font-family:${FONTE};color:#121212;">
<span style="font-size:18px;font-weight:800;letter-spacing:-0.3px;"><span style="color:#6d3ff5;">{</span>daily paper<span style="color:#6d3ff5;">}</span></span></td></tr>
<tr><td style="font-family:${FONTE};color:#3f3d39;font-size:14px;line-height:1.75;">${corpo}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Boas-vindas: o que é a plataforma e como funciona. */
export function emailBoasVindas(nome: string) {
  const passo = (n: number, titulo: string, texto: string) =>
    `<tr><td style="padding:14px 0;border-top:1px solid #e1dfda;font-family:${FONTE};">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#6d3ff5;">PASSO ${n}</p>
      <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#121212;">${titulo}</p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#3f3d39;">${texto}</p></td></tr>`;
  const corpo = `
<h1 style="margin:0 0 12px;font-family:${FONTE};font-size:26px;line-height:1.2;font-weight:800;color:#121212;">Boas-vindas${nome ? `, ${esc(nome)}` : ""}!</h1>
<p style="margin:0 0 20px;">O Daily Paper junta as notícias dos sites que você escolhe num só lugar, com o texto limpo
(sem anúncios nem pop-ups) e um resumo feito por IA de cada matéria. Uma vez por dia, ele também manda
um resumo por e-mail com o que de mais recente chegou.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${passo(1, "Siga suas fontes", "Escolha entre quase mil veículos do Brasil e de fora, por tema ou região, ou cole o endereço de qualquer site. Não precisa saber o que é RSS.")}
${passo(2, "Organize em coleções", "Agrupe as fontes por assunto (Tecnologia, Minas, Esportes...). Cada coleção vira um feed só dela.")}
${passo(3, "Leia sem distração", "Abra qualquer notícia para ler o resumo e o texto completo ali mesmo. Salve para ler mais tarde.")}
${passo(4, "Receba o resumo do dia", "Escolha o horário e as coleções em Configurações › Resumo diário. Você também pode compartilhar o resumo com até 10 pessoas.")}
</table>
<p style="margin:24px 0 0;"><a href="${URL_DO_HUB}/explorar" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#121212;color:#ffffff;font-family:${FONTE};font-size:13px;font-weight:700;text-decoration:none;">Seguir as primeiras fontes →</a></p>
<p style="margin:28px 0 0;font-size:11px;color:#8d8a83;">Você recebe este e-mail porque criou uma conta no Daily Paper.</p>`;
  return moldura("Boas-vindas ao Daily Paper", corpo);
}

/** Feedback de quem usa, pro e-mail do projeto. */
export function emailFeedback(dados: { de: string; tipo: string; mensagem: string }) {
  const corpo = `
<h1 style="margin:0 0 6px;font-family:${FONTE};font-size:20px;font-weight:800;color:#121212;">Feedback: ${esc(dados.tipo)}</h1>
<p style="margin:0 0 18px;font-size:12px;color:#8d8a83;">De ${esc(dados.de)} (responda este e-mail para falar com a pessoa)</p>
<p style="margin:0;white-space:pre-wrap;">${esc(dados.mensagem)}</p>`;
  return moldura("Feedback", corpo);
}
