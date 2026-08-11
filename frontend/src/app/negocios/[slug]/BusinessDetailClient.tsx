"use client";

import { useEffect, useState } from "react";
import { fetchFromStrapi, getStrapiUrl } from "@/lib/strapi";

import BookingWidget from "@/components/business/BookingWidget";
import ReviewSection from "@/components/business/ReviewSection";
import BusinessHero from "@/components/business/BusinessHero";
import BusinessSidebar from "@/components/business/BusinessSidebar";
import BusinessActions from "@/components/business/BusinessActions";
import BusinessGallery from "@/components/business/BusinessGallery";
import NavigationFAB from "@/components/layout/NavigationFAB";
import GoogleMap from "@/components/common/GoogleMap";
import OfferModule from "@/components/business/OfferModule";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Settings, MapPin, Phone, ExternalLink } from "lucide-react";
import RatingSources from "@/components/business/RatingSources";
import GooglePlacesReviews from "@/components/business/GooglePlacesReviews";

import { Negocio } from "@/types/strapi";
import {
  getOpenSchedulesForDay,
  isOpenDuringAnySchedule,
} from "@/lib/schedules";

export default function BusinessDetailClient({ initialNegocio, slug }: { initialNegocio: Negocio; slug: string }) {
  const [negocio, setNegocio] = useState<Negocio | null>(initialNegocio);
  const [error, setError] = useState(false);

  // Claim Flow State
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const autoClaim = searchParams.get("auto_claim");
  
  // Etapa 3: Scroll detection para el FAB
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (autoClaim === "1" && session?.user && negocio) {
      setShowClaimModal(true);
      router.replace(`/negocios/${slug}`, { scroll: false });
    }
  }, [autoClaim, session, negocio, slug, router]);

  const loadBusinessData = async () => {
    try {
      const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo&populate[logo][fields][0]=url&populate[imagen_portada][fields][1]=url&populate[galeria][fields][0]=url&populate[schedules]=*&populate[owner][fields][0]=id&populate[reserva_comercio][fields][0]=slug&populate[reserva_comercio][fields][1]=nombre&fields[0]=nombre&fields[1]=descripcion&fields[2]=direccion&fields[3]=telefono&fields[4]=whatsapp&fields[5]=website&fields[6]=instagram&fields[7]=facebook&fields[8]=latitud&fields[9]=longitud&fields[10]=verificado&fields[11]=reclamar_habilitado&fields[12]=reserva_url&fields[13]=reserva_habilitada&fields[14]=rating&fields[15]=review_count&fields[16]=is_premium&fields[17]=premium_valid_until&fields[18]=google_rating&fields[19]=google_review_count&fields[20]=google_place_id&fields[21]=tripadvisor_rating&fields[22]=tripadvisor_review_count&fields[23]=tripadvisor_url&fields[24]=cta_habilitado&fields[25]=cta_titulo&fields[26]=cta_texto&fields[27]=cta_boton_texto&fields[28]=cta_link&fields[29]=cta_tag_confirmacion&fields[30]=cta_tag_sin_comisiones&fields[31]=google_reviews&fields[32]=google_reviews_synced_at";
      const res = await fetchFromStrapi(`negocios?filters[slug][$eq]=${slug}&${populate}`);
      let businessData = res.data?.[0];
      if (!businessData) {
        const resById = await fetchFromStrapi(`negocios?filters[documentId][$eq]=${slug}&${populate}`);
        businessData = resById.data?.[0];
      }
      if (businessData) {
        setNegocio(businessData);
      } else if (!negocio) {
        setError(true);
      }
    } catch {
      if (!negocio) {
        setError(true);
      }
    }
  };

  useEffect(() => {
    // Solo cargamos si por alguna razón no se proveyó data inicial (fallback)
    if (!initialNegocio) {
      loadBusinessData();
    }
    window.scrollTo(0, 0);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (negocio?.documentId || slug) {
      const targetId = negocio?.documentId || slug;
      const incrementView = async () => {
        try {
          const strapiUrl = getStrapiUrl();
          await fetch(`${strapiUrl}/api/negocios/${targetId}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'view' })
          });
        } catch {}
      };
      incrementView();
    }
  }, [negocio?.documentId, slug]);

  const trackClick = async (type: 'whatsapp' | 'website' | 'view') => {
    if (!negocio?.documentId) return;
    try {
      const strapiUrl = getStrapiUrl();
      await fetch(`${strapiUrl}/api/negocios/${negocio.documentId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (e) {
      console.error(`Error tracking ${type} click:`, e);
    }
  };

  const handleClaimSubmit = async () => {
    if (!session || !negocio) return;
    setClaimErrorMessage(null);
    setClaimSuccessMessage(null);

    if (!claimFile) {
      setClaimErrorMessage(
        "La documentación probatoria (DNI o Habilitación) es obligatoria."
      );
      return;
    }

    setIsClaiming(true);
    try {
      const strapiUrl = getStrapiUrl();
      const formData = new FormData();
      formData.append("data", JSON.stringify({ message: claimMessage }));
      formData.append("documentacion_reclamo", claimFile);
      
      const res = await fetch(`${strapiUrl}/api/negocios/${negocio.documentId}/claim`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.jwt}` },
        body: formData
      });

      if (res.ok) {
        setClaimSuccessMessage(
          "Tu solicitud de reclamo está pendiente de aprobación."
        );
        setShowClaimModal(false);
      } else {
        const payload = await res.json().catch(() => null);
        setClaimErrorMessage(
          payload?.error?.message || "Error al enviar el reclamo."
        );
      }
    } catch {
      setClaimErrorMessage("Error de conexión.");
    } finally {
      setIsClaiming(false);
    }
  };



  if (error || !negocio) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-white mb-4">No encontramos este lugar</h1>
      <Link href="/" className="bg-primary text-black px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg">Volver al Inicio</Link>
    </div>
  );

  const getBusinessStatus = () => {
    try {
      if (!negocio.schedules || !Array.isArray(negocio.schedules) || negocio.schedules.length === 0) return null;
      
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const now = new Date();
      const todaySchedules = getOpenSchedulesForDay(
        negocio.schedules,
        days[now.getDay()]
      );
      
      if (todaySchedules.length === 0) {
        return { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
      }

      const cur = now.getHours() * 60 + now.getMinutes();
      const isOpen = isOpenDuringAnySchedule(todaySchedules, cur);
      
      return isOpen 
        ? { status: "Abierto ahora", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
        : { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } catch (e) {
      console.error("Error calculating business status:", e);
      return null;
    }
  };

  const businessStatus = getBusinessStatus();
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  
  let isValidPremium = negocio?.is_premium || false;
  if (isValidPremium && negocio?.premium_valid_until && new Date() > new Date(negocio.premium_valid_until)) {
    isValidPremium = false;
  }

  return (
    <main data-testid="business-detail-page" className="min-h-screen bg-background pb-20">
      <NavigationFAB isVisible={showScrollTop} type="back" onClick={() => router.back()} />

      <BusinessHero negocio={negocio} businessStatus={businessStatus} />

      <BusinessActions 
        negocio={negocio} 
        isValidPremium={isValidPremium} 
        onTrackClick={trackClick} 
      />

      <section className="py-6 md:py-20 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* RECLAMAR PERFIL — Visible para todos en todo dispositivo, arriba del contenido */}
        {negocio.reclamar_habilitado && !negocio.owner && (!negocio.estado_reclamo || negocio.estado_reclamo === 'ninguno') && !isValidPremium && (
          <div className="mb-8 p-5 rounded-[2rem] bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-blue-900/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">¿Gestionás este negocio?</p>
                <p className="text-slate-200 text-xs leading-tight">Tomá el control total de tu negocio en el portal: Fotos, Videos, Reseñas, Horarios, Whatsapp, Botón de Redes sociales, y más.</p>
              </div>
            </div>
            <button
              data-testid="claim-profile-button"
              onClick={() => {
                if (!session) router.push(`/registro?claim=${slug}`);
                else setShowClaimModal(true);
              }}
              className="shrink-0 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30 w-full sm:w-auto text-center"
            >
              Reclamar Perfil
            </button>
          </div>
        )}

        {/* INFO MÓVIL: Ubicación y Contacto al principio para el Turista (Visible para TODOS) */}
        <div className="lg:hidden mb-8 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/10 shadow-2xl">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black shrink-0 shadow-lg shadow-primary/20">
                   <MapPin className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-lg text-white font-bold leading-tight">{negocio.direccion || "San Rafael, Mendoza"}</p>
                   <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-black mt-1">Ubicación del Negocio</p>
                </div>
             </div>
             
             {/* El mapa es exclusivo Premium — la dirección y botones son para todos */}
             {isValidPremium && negocio.latitud && negocio.longitud && (
                <div className="h-48 rounded-[2rem] overflow-hidden border border-white/5 mb-6">
                   <GoogleMap lat={negocio.latitud} lng={negocio.longitud} title={negocio.nombre} />
                </div>
             )}
             
             <div className="grid grid-cols-2 gap-3">
                {negocio.telefono && (
                  <a href={`tel:${negocio.telefono}`} className="flex items-center justify-center gap-2 py-4 bg-white/15 border border-white/30 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                     <Phone className="w-4 h-4 text-primary" /> Llamar
                  </a>
                )}
                <a 
                  href={negocio.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-4 bg-primary rounded-2xl text-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                   <ExternalLink className="w-4 h-4" /> Ver Maps
                </a>
             </div>
          </div>
          <RatingSources negocio={negocio} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-12 md:space-y-20">
            {/* Gallery — RESTAURADA (ETAPA 4) */}
            <BusinessGallery negocio={negocio} isValidPremium={isValidPremium} />


            <div className="prose prose-invert max-w-none">
              <h3 className="text-3xl font-serif font-bold text-white mb-6 italic">Sobre el <span className="text-primary">negocio</span></h3>
              <div 
                className="text-slate-200 text-lg leading-relaxed space-y-6 whitespace-pre-wrap" 
                dangerouslySetInnerHTML={{ __html: negocio.descripcion || "Descubrí la mejor atención y calidad." }} 
              />
            </div>

            <OfferModule ofertas={negocio.ofertas} />

            <BookingWidget 
              businessName={negocio.nombre} 
              reservaUrl={negocio.reserva_url}
              reservaHabilitada={negocio.reserva_habilitada}
              ctaHabilitado={negocio.cta_habilitado}
              ctaTitulo={negocio.cta_titulo}
              ctaTexto={negocio.cta_texto}
              ctaBotonTexto={negocio.cta_boton_texto}
              ctaLink={negocio.cta_link}
              ctaTagConfirmacion={negocio.cta_tag_confirmacion}
              ctaTagSinComisiones={negocio.cta_tag_sin_comisiones}
              reservaModuloSlug={negocio.reserva_comercio?.slug}
              whatsapp={negocio.whatsapp || negocio.telefono}  
              onTrackClick={trackClick}
            />
          </div>

          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <RatingSources negocio={negocio} />
            <BusinessSidebar 
              negocio={negocio} 
              isValidPremium={isValidPremium} 
              session={session} 
              slug={slug} 
              setShowClaimModal={setShowClaimModal} 
              router={router} 
            />
          </aside>

          <div className="lg:col-span-2 space-y-12">
            {isValidPremium && negocio.google_reviews && negocio.google_reviews.length > 0 && (
              <GooglePlacesReviews reviews={negocio.google_reviews} />
            )}
            <div id="reviews-section">
              <ReviewSection 
                negocioId={negocio.documentId} 
                ownerId={ownerId} 
                initialRating={negocio.rating} 
                initialCount={negocio.review_count} 
              />
            </div>
          </div>
        </div>
      </section>

      {showClaimModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          data-testid="claim-modal"
        >
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Reclamar Perfil</h3>
            <textarea
              data-testid="claim-message"
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              placeholder="Hola, soy el dueño..."
              className="w-full h-24 p-4 bg-slate-800 rounded-xl text-white mb-4 outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              id="claim-file-upload"
              data-testid="claim-file-upload"
              type="file"
              onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
              className="mb-4 text-white text-xs"
            />
            <div className="flex flex-col gap-3">
              <button
                data-testid="claim-submit"
                onClick={handleClaimSubmit}
                disabled={isClaiming}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all"
              >
                {isClaiming ? "Enviando..." : "Enviar Solicitud"}
              </button>
              <button onClick={() => setShowClaimModal(false)} className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest">Cancelar</button>
            </div>
            {claimErrorMessage && (
              <p data-testid="claim-error" className="mt-4 text-red-400 text-xs text-center">
                {claimErrorMessage}
              </p>
            )}
          </div>
        </div>
      )}
      {claimSuccessMessage && (
        <div
          data-testid="claim-success"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-6 py-4 text-sm font-bold text-emerald-300 shadow-2xl"
          role="status"
        >
          {claimSuccessMessage}
        </div>
      )}
    </main>
  );
}
