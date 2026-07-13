import { Suspense } from "react";
import HomeClient from "@/components/home/HomeClient";
import { getCategorias } from "@/lib/categorias";

export default async function Home() {
  const categorias = await getCategorias();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClient categorias={categorias} />
    </Suspense>
  );
}
