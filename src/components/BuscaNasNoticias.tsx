import Form from "next/form";
import { Icon } from "./Icon";

/** A busca nas notícias das fontes da pessoa: na página Buscar e, no
 * celular, no topo de Lidos recentemente (a aba "Lidos" de baixo). */
export function BuscaNasNoticias({ termo = "", focar = false }: { termo?: string; focar?: boolean }) {
  return (
    <Form action="/buscar" className="group mb-10">
      <label className="flex h-12 items-center gap-3 rounded-lg border border-border bg-surface px-4 transition-colors focus-within:border-text-muted">
        <Icon nome="buscar" className="text-text-muted" />
        <input
          type="text"
          name="q"
          defaultValue={termo}
          autoFocus={focar}
          enterKeyHint="search"
          placeholder="Buscar nas suas notícias"
          className="h-full flex-grow bg-transparent text-[15px] text-foreground outline-none placeholder:text-text-muted"
        />
      </label>
    </Form>
  );
}
