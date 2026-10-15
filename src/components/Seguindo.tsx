"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { deixarDeSeguir, seguir } from "@/app/actions/seguir";
import { idDoItem, type ItemSeguido } from "@/lib/seguir";
import { Icon } from "./Icon";
import { mostrarToast } from "./Toast";

/* O que a pessoa segue (temas e nomes, sql/045), pra qualquer tela saber e
 * mudar na hora: o leitor de notícia, a aba Temas de Seguir, a seção Temas
 * do menu. A lista vem do layout; seguir/deixar de seguir muda aqui
 * primeiro e grava depois (se der erro, volta). */

type ValorSeguindo = {
  itens: ItemSeguido[];
  segue: (item: Pick<ItemSeguido, "tipo" | "chave">) => boolean;
  alternar: (item: ItemSeguido) => void;
};

const Contexto = createContext<ValorSeguindo | null>(null);

export function ProvedorSeguindo({ inicial, children }: { inicial: ItemSeguido[]; children: React.ReactNode }) {
  // Quando o servidor manda a lista de novo (depois de gravar), ela já
  // vem com a mudança: recomeça dela
  const [estado, setEstado] = useState({ base: inicial, itens: inicial });
  if (estado.base !== inicial) setEstado({ base: inicial, itens: inicial });
  const [, startTransition] = useTransition();

  const ids = useMemo(() => new Set(estado.itens.map(idDoItem)), [estado.itens]);
  const segue = useCallback((item: Pick<ItemSeguido, "tipo" | "chave">) => ids.has(idDoItem(item)), [ids]);

  const alternar = useCallback(
    (item: ItemSeguido) => {
      const jaSegue = ids.has(idDoItem(item));
      const antes = estado.itens;
      setEstado((atual) => ({
        ...atual,
        itens: jaSegue ? atual.itens.filter((x) => idDoItem(x) !== idDoItem(item)) : [...atual.itens, item],
      }));
      startTransition(async () => {
        const resultado = jaSegue ? await deixarDeSeguir(item) : await seguir(item);
        if (resultado.erro) {
          setEstado((atual) => ({ ...atual, itens: antes }));
          mostrarToast(resultado.erro);
          return;
        }
        mostrarToast(jaSegue ? `Você deixou de seguir ${item.rotulo}` : `Seguindo ${item.rotulo}. As notícias aparecem em Temas`);
      });
    },
    [ids, estado.itens],
  );

  const valor = useMemo(() => ({ itens: estado.itens, segue, alternar }), [estado.itens, segue, alternar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSeguindo() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useSeguindo fora do ProvedorSeguindo");
  return valor;
}

/** "+ Lula" pra seguir, "✓ Lula" quando já segue (clicar de novo deixa de seguir). */
export function ChipSeguir({ item }: { item: ItemSeguido }) {
  const { segue, alternar } = useSeguindo();
  const ativo = segue(item);
  return (
    <button
      type="button"
      aria-pressed={ativo}
      title={ativo ? `Deixar de seguir ${item.rotulo}` : `Seguir ${item.rotulo}`}
      onClick={(e) => {
        e.stopPropagation();
        alternar(item);
      }}
      className={`flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] transition duration-150 active:scale-95 ${
        ativo
          ? "border-accent bg-accent-soft font-semibold text-accent"
          : "border-border text-text-secondary hover:border-accent hover:text-accent"
      }`}
    >
      <Icon nome={ativo ? "check" : "adicionar"} tamanho={13} espessura={2} className="flex-shrink-0" />
      <span className="truncate">{item.tipo === "tema" ? `#${item.rotulo.toLowerCase()}` : item.rotulo}</span>
    </button>
  );
}
