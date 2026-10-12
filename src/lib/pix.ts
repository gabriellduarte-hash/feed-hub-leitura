/** Código PIX "copia e cola" (BR Code estático), no padrão do Banco
 * Central: campos no formato ID + tamanho + valor, e um CRC16 no fim.
 * O mesmo texto vira o QR Code. Valor opcional: sem ele, quem paga
 * digita o valor no app do banco. */

export type ContaPix = { chave: string; nome: string; cidade: string };

const CHAVE_ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

/** A chave no formato que o banco procura, ou null se não for uma chave
 * PIX válida. Em 12/10 a chave aleatória estava com "22:31" colado no fim
 * (um horário copiado junto do app do banco) e nenhum QR funcionava. */
export function normalizarChavePix(bruta: string): string | null {
  const chave = bruta.trim();
  if (CHAVE_ALEATORIA.test(chave)) return chave.toLowerCase();
  if (EMAIL.test(chave) && chave.length <= 77) return chave.toLowerCase();
  const digitos = chave.replace(/\D/g, "");
  if (chave.startsWith("+")) return /^55\d{10,11}$/.test(digitos) ? `+${digitos}` : null; // celular: +55 DDD número
  if (CPF.test(chave) || CNPJ.test(chave)) return digitos;
  return null;
}

/** Configurada nas variáveis da Vercel (são públicas: aparecem na tela).
 * Chave inválida conta como não configurada: melhor "em breve" do que um
 * QR Code que o banco recusa. */
export function contaPixConfigurada(): ContaPix | null {
  const bruta = process.env.NEXT_PUBLIC_PIX_CHAVE?.trim();
  const nome = process.env.NEXT_PUBLIC_PIX_NOME?.trim();
  const cidade = process.env.NEXT_PUBLIC_PIX_CIDADE?.trim();
  if (!bruta || !nome || !cidade) return null;
  const chave = normalizarChavePix(bruta);
  if (!chave) {
    console.warn("[pix] NEXT_PUBLIC_PIX_CHAVE não é uma chave PIX válida (aleatória, e-mail, CPF, CNPJ ou +55 celular)");
    return null;
  }
  return { chave, nome, cidade };
}

function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

// O padrão pede só letras sem acento, números e espaço em nome e cidade
function semAcento(texto: string, maximo: number) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, maximo);
}

// CRC16-CCITT (polinômio 0x1021, começando em 0xFFFF), como pede o padrão
function crc16(texto: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function codigoPix(conta: ContaPix, valor?: number) {
  const corpo =
    campo("00", "01") +
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", conta.chave)) +
    campo("52", "0000") +
    campo("53", "986") +
    (valor && valor > 0 ? campo("54", valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", semAcento(conta.nome, 25)) +
    campo("60", semAcento(conta.cidade, 15)) +
    campo("62", campo("05", "***")) +
    "6304";
  return corpo + crc16(corpo);
}
