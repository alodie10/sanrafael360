import { notFound } from "next/navigation";
import BusinessDetailClient from "./BusinessDetailClient";
import DirectoryListingClient from "./DirectoryListingClient";
import FichaAnswers from "@/components/business/FichaAnswers";
import { getNegocioBySlug } from "@/lib/negocios";
import { showsPublicFicha } from "@/lib/search-match";

export default async function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const negocio = await getNegocioBySlug(slug);

  if (!negocio) {
    notFound();
  }

  if (!showsPublicFicha(negocio)) {
    return <DirectoryListingClient initialNegocio={negocio} slug={slug} />;
  }

  return (
    <BusinessDetailClient
      initialNegocio={negocio}
      slug={slug}
      lead={<FichaAnswers negocio={negocio} />}
    />
  );
}
