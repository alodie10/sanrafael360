import { notFound } from "next/navigation";
import BusinessDetailClient from "./BusinessDetailClient";
import { getNegocioBySlug } from "@/lib/negocios";

export default async function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const negocio = await getNegocioBySlug(slug);

  if (!negocio) {
    notFound();
  }

  return <BusinessDetailClient initialNegocio={negocio} slug={slug} />;
}
