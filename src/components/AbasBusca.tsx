import { Tabs } from "./PageHeader";

/** No celular, Buscar e Lidos recentemente ficam na mesma aba do menu de
 * baixo: as duas páginas mostram estas abas no topo. No computador os dois
 * já estão no menu lateral, então não aparecem. */
export function AbasBusca({ ativa }: { ativa: "buscar" | "lidos" }) {
  return (
    <div className="md:hidden">
      <Tabs
        ativa={ativa}
        abas={[
          { chave: "buscar", rotulo: "Buscar", href: "/buscar" },
          { chave: "lidos", rotulo: "Lidos recentemente", href: "/lidos-recentemente" },
        ]}
      />
    </div>
  );
}
