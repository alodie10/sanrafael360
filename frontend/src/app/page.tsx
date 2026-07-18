import { Suspense } from "react";
import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";
import { getCategorias } from "@/lib/categorias";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: getSiteUrl(),
  },
};

export default async function Home() {
  const categorias = await getCategorias();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClient categorias={categorias} />
    </Suspense>
  );
}
