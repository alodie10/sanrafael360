import { notFound, unstable_rethrow } from "next/navigation";
import { fetchEfemeridePublic } from "@/lib/efemerides";
import EfemerideHero from "@/components/efemerides/EfemerideHero";
import EfemeridePublicGrid from "@/components/efemerides/EfemeridePublicGrid";

export const dynamic = "force-dynamic";

export default async function EfemeridePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let efemeride = null;

  try {
    efemeride = await fetchEfemeridePublic(slug);
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error("Error cargando efeméride:", error);
  }

  if (!efemeride) notFound();

  const isFeria = efemeride.tipo === "feria";

  return (
    <main className="min-h-screen bg-background pb-20" data-testid="efemeride-public-page">
      <EfemerideHero efemeride={efemeride} />

      {!isFeria && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Explorá {efemeride.items.length} opciones
            </h2>
          </div>
          <EfemeridePublicGrid items={efemeride.items} />
        </div>
      )}
    </main>
  );
}
