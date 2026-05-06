"use client";

import { useEffect, useState, use } from "react";
import { fetchFromStrapi } from "@/lib/strapi";
import { ADMIN_EMAILS } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import BookingWidget from "@/components/business/BookingWidget";
import ReviewSection from "@/components/business/ReviewSection";
import BusinessHero from "@/components/business/BusinessHero";
import BusinessSidebar from "@/components/business/BusinessSidebar";
import BusinessActions from "@/components/business/BusinessActions";
import BusinessGallery from "@/components/business/BusinessGallery";
import NavigationFAB from "@/components/layout/NavigationFAB";
import GoogleMap from "@/components/common/GoogleMap";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Settings, MapPin, Phone, ExternalLink } from "lucide-react";

import { Negocio } from "@/types/strapi";

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Claim Flow State
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
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
      setLoading(true);
      const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[logo][fields][0]=url&populate[imagen_portada][fields][1]=url&populate[galeria][fields][0]=url&populate[schedules]=*&populate[owner][fields][0]=id&fields[0]=nombre&fields[1]=descripcion&fields[2]=direccion&fields[3]=telefono&fields[4]=whatsapp&fields[5]=website&fields[6]=instagram&fields[7]=facebook&fields[8]=latitud&fields[9]=longitud&fields[10]=verificado&fields[11]=reclamar_habilitado&fields[12]=reserva_url&fields[13]=reserva_habilitada&fields[14]=rating&fields[15]=review_count&fields[16]=is_premium&fields[17]=premium_valid_until";
      const res = await fetchFromStrapi(`negocios?filters[slug][$eq]=${slug}&${populate}`);
      let businessData = res.data?.[0];
      if (!businessData) {
        const resById = await fetchFromStrapi(`negocios?filters[documentId][$eq]=${slug}&${populate}`);
        businessData = resById.data?.[0];
      }
      if (businessData) {
        setNegocio(businessData);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (negocio?.documentId || slug) {
      const targetId = negocio?.documentId || slug;
      const incrementView = async () => {
        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
          await fetch(`${strapiUrl}/api/negocios/${targetId}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'view' })
          });
        } catch (e) {}
      };
      incrementView();
    }
  }, [negocio?.documentId, slug]);

  const trackClick = async (type: 'whatsapp' | 'website' | 'view') => {
    if (!negocio?.documentId) return;
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
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
    setIsClaiming(true);
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      const formData = new FormData();
      formData.append("data", JSON.stringify({ message: claimMessage }));
      if (claimFile) formData.append("documentacion_reclamo", claimFile);
      
      const res = await fetch(`${strapiUrl}/api/negocios/${negocio.documentId}/claim`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.jwt}` },
        body: formData
      });

      if (res.ok) {
        alert("¡Tu solicitud ha sido enviada!");
        setShowClaimModal(false);
      } else {
        setClaimErrorMessage("Error al enviar el reclamo.");
      }
    } catch (e) {
      setClaimErrorMessage("Error de conexión.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-medium">Cargando experiencias...</p>
    </div>
  );

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
      const todaySchedule = negocio.schedules.find((s: any) => s.day === days[now.getDay()]);
      
      if (!todaySchedule || todaySchedule.is_closed || !todaySchedule.opening_time || !todaySchedule.closing_time) {
        return { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
      }
      
      const parseTime = (t: string) => { 
        if (!t || typeof t !== 'string') return 0;
        const parts = t.split(":");
        if (parts.length < 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]); 
      };

      const cur = now.getHours() * 60 + now.getMinutes();
      const open = parseTime(todaySchedule.opening_time);
      const close = parseTime(todaySchedule.closing_time);
      
      // Manejo de horarios que cruzan la medianoche (ej: 20:00 a 02:00)
      const isOpen = close < open 
        ? (cur >= open || cur <= close) 
        : (cur >= open && cur <= close);
      
      return isOpen 
        ? { status: "Abierto ahora", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
        : { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } catch (e) {
      console.error("Error calculating business status:", e);
      return null;
    }
  };

  const businessStatus = getBusinessStatus();
  const sessionUserId = String((session as any)?.user?.id || "");
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  const isAdmin = (session as any)?.user?.role?.toLowerCase() === 'admin' || ADMIN_EMAILS.includes((session as any)?.user?.email || "");
  const canManage = Boolean(isAdmin || (sessionUserId && ownerId && sessionUserId === ownerId));
  
  let isValidPremium = negocio?.is_premium || false;
  if (isValidPremium && negocio?.premium_valid_until && new Date() > new Date(negocio.premium_valid_until)) {
    isValidPremium = false;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      <NavigationFAB isVisible={showScrollTop} type="back" onClick={() => router.back()} />

      <BusinessHero negocio={negocio} businessStatus={businessStatus} />

      <BusinessActions 
        negocio={negocio} 
        isValidPremium={isValidPremium} 
        onTrackClick={trackClick} 
      />

      <section className="py-6 md:py-20 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* INFO MÓVIL: Ubicación y Contacto al principio para el Turista (Visible para TODOS) */}
        <div className="lg:hidden mb-8">
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
                  <a href={`tel:${negocio.telefono}`} className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-12 md:space-y-20">
            {/* Gallery — RESTAURADA (ETAPA 4) */}
            <BusinessGallery negocio={negocio} isValidPremium={isValidPremium} />


            <div className="prose prose-invert max-w-none">
              <h3 className="text-3xl font-serif font-bold text-white mb-6 italic">Sobre el <span className="text-primary">negocio</span></h3>
              <div 
                className="text-slate-300 text-lg leading-relaxed space-y-6" 
                dangerouslySetInnerHTML={{ __html: negocio.descripcion || "Descubrí la mejor atención y calidad." }} 
              />
            </div>
            <BookingWidget 
              businessName={negocio.nombre} 
              reservaUrl={negocio.reserva_url}
              reservaHabilitada={negocio.reserva_habilitada}
              whatsapp={negocio.telefono_whatsapp || negocio.telefono} 
              onTrackClick={trackClick}
            />
          </div>

          <aside className="hidden lg:block lg:col-span-1">
            <BusinessSidebar 
              negocio={negocio} 
              isValidPremium={isValidPremium} 
              session={session} 
              slug={slug} 
              setShowClaimModal={setShowClaimModal} 
              router={router} 
            />
          </aside>

          <div className="lg:col-span-2">
            <ReviewSection 
              negocioId={negocio.documentId} 
              ownerId={ownerId} 
              initialRating={negocio.rating} 
              initialCount={negocio.review_count} 
            />
          </div>
        </div>
      </section>

      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Reclamar Perfil</h3>
            <textarea value={claimMessage} onChange={(e) => setClaimMessage(e.target.value)} placeholder="Tu mensaje..." className="w-full h-24 p-4 bg-slate-800 rounded-xl text-white mb-4 outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="file" onChange={(e) => setClaimFile(e.target.files?.[0] || null)} className="mb-4 text-white text-xs" />
            <div className="flex flex-col gap-3">
              <button onClick={handleClaimSubmit} disabled={isClaiming} className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all">{isClaiming ? "Enviando..." : "Confirmar Reclamo"}</button>
              <button onClick={() => setShowClaimModal(false)} className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest">Cancelar</button>
            </div>
            {claimErrorMessage && <p className="mt-4 text-red-400 text-xs text-center">{claimErrorMessage}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
