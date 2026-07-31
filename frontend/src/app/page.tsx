import { Suspense } from "react";
import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";
import { getCategorias } from "@/lib/categorias";
import { getHomeNegocios } from "@/lib/search-negocios";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: getSiteUrl(),
  },
};

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    l?: string;
    cat?: string;
    categoria?: string;
  }>;
};

function resolveCategoryDocId(
  catParam: string | undefined,
  categorias: Awaited<ReturnType<typeof getCategorias>>
): string | null {
  if (!catParam) return null;
  const normalized = catParam.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const found = categorias.find((c) => {
    const name = c.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return c.documentId === catParam || c.slug === catParam || name === normalized;
  });
  return found?.documentId ?? null;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const categorias = await getCategorias();
  const categoryDocId = resolveCategoryDocId(params.cat || params.categoria, categorias);
  const initialNegocios = await getHomeNegocios({
    query: params.q || "",
    localidad: params.l || "",
    categoryDocId,
    categorias,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClient categorias={categorias} initialNegocios={initialNegocios} />
    </Suspense>
  );
}
