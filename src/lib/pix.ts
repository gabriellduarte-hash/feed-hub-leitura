/** Código PIX "copia e cola" (BR Code estático), no padrão do Banco
 * Central: campos no formato ID + tamanho + valor, e um CRC16 no fim.
 * O mesmo texto vira o QR Code. Valor opcional: sem ele, quem paga
 * digita o valor no app do banco. */

export type ContaPix = { chave: string; nome: string; cidade: string };

/** Configurada nas variáveis da Vercel (são públicas: aparecem na tela). */
export function contaPixConfigurada(): ContaPix | null {
  const chave = process.env.NEXT_PUBLIC_PIX_CHAVE?.trim();
  const nome = process.env.NEXT_PUBLIC_PIX_NOME?.trim();
  const cidade = process.env.NEXT_PUBLIC_PIX_CIDADE?.trim();
  return chave && nome && cidade ? { chave, nome, cidade } : null;
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
