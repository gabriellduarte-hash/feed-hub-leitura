import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { PaginaFeeds } from "@/components/PaginaFeeds";

export default function FeedsPage() {
  return (
    <Conteudo>
      <PageHeader titulo="Coleções" subtitulo="As fontes que você segue, os temas e o resumo por e-mail" />
      <PaginaFeeds />
    </Conteudo>
  );
}
