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
      <section className="relative h-[70svh] min-h-[28rem] max-h-[36rem] overflow-hidden border-b border-white/5 md:h-[36rem] md:max-h-none">
        {coverUrl && (
          <>
            <Image
              src={coverUrl}
              alt=""
              fill
              priority
              className="object-cover object-[center_42%] opacity-95 brightness-[1.15] contrast-[1.25] saturate-110 md:object-center md:opacity-90"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-35% to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
          </>
        )}
        {!coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        )}

        <div className="absolute inset-x-0 top-20 z-10 px-4 text-center md:top-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-primary transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-7 pt-16 text-center md:pb-10 md:pt-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary md:mb-3">
              Efeméride
            </p>
            <h1 className="mb-2 text-2xl font-bold leading-tight text-white md:mb-3 md:text-5xl">
              {efemeride.nombre} en <span className="text-primary italic">San Rafael</span>
            </h1>
            {efemeride.descripcion && (
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-200 md:text-lg">
                {efemeride.descripcion}
              </p>
            )}
            {hastaLabel && (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-primary md:mt-4 md:text-xs">
                Vigente hasta {hastaLabel}
              </p>
            )}
          </div>
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
