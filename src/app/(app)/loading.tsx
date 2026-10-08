/* Cada loading.tsx cobre a troca entre as páginas logo abaixo da sua
 * pasta (o Next cria a fronteira por filho); por isso há um em (app),
 * feeds, feeds/colecao, feeds/fonte e explorar. */
import { EsqueletoPagina } from "@/components/Carregando";

export default function Carregando() {
  return <EsqueletoPagina />;
}
