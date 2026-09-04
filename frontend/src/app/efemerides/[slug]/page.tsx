import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, unstable_rethrow } from "next/navigation";
import { fetchEfemeridePublic } from "@/lib/efemerides";
import { getStrapiMedia } from "@/lib/strapi";
import { formatCalendarDate } from "@/lib/calendar-date";
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
  } catch (error: any) {
    unstable_rethrow(error);
    console.error("Error cargando efeméride:", error);
  }

  if (!efemeride) notFound();

  const coverUrl = efemeride.encabezado?.url ? getStrapiMedia(efemeride.encabezado.url) : null;
  const hastaLabel = efemeride.vigente_hasta
    ? formatCalendarDate(efemeride.vigente_hasta, { day: "numeric", month: "long" })
    : null;

  return (
    <main className="min-h-screen bg-background pb-20" data-testid="efemeride-public-page">
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 px-4 text-center border-b border-white/5 bg-slate-900/50 overflow-hidden">
        {coverUrl && (
          <>
            <Image
              src={coverUrl}
              alt={efemeride.nombre}
              fill
              priority
              className="object-cover opacity-30"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-slate-950/70 to-background pointer-events-none" />
          </>
        )}
        {!coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        )}

        <div className="max-w-4xl mx-auto relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">
            Efeméride
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {efemeride.nombre} en <span className="text-primary italic">San Rafael</span>
          </h1>
          {efemeride.descripcion && (
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              {efemeride.descripcion}
            </p>
          )}
          {hastaLabel && (
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary/80">
              Vigente hasta {hastaLabel}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Explorá {efemeride.items.length} opciones
          </h2>
        </div>
        <EfemeridePublicGrid items={efemeride.items} />
      </div>
    </main>
  );
}
