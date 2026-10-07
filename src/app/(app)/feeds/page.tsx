import { Conteudo } from "@/components/FeedLayout";
import { PageHeader } from "@/components/PageHeader";
import { PaginaFeeds } from "@/components/PaginaFeeds";

export default function FeedsPage() {
  return (
    <Conteudo>
      <PageHeader titulo="Feeds" subtitulo="Suas coleções, as fontes que você segue e o resumo por e-mail" />
      <PaginaFeeds />
    </Conteudo>
  );
}
