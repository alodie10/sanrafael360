"use client";

import { useEffect, useState, use } from "react";
import { fetchFromStrapi } from "@/lib/strapi";
import Navbar from "@/components/layout/Navbar";
import BookingWidget from "@/components/business/BookingWidget";
import ReviewSection from "@/components/business/ReviewSection";
import BusinessHero from "@/components/business/BusinessHero";
import BusinessSidebar from "@/components/business/BusinessSidebar";
import BusinessActions from "@/components/business/BusinessActions";
import NavigationFAB from "@/components/layout/NavigationFAB";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Settings } from "lucide-react";

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [negocio, setNegocio] = useState<any | null>(null);
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

  const trackClick = async (type: 'whatsapp' | 'website') => {
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
    if (!session) return;
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
    if (!negocio.schedules || negocio.schedules.length === 0) return null;
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const now = new Date();
    const todaySchedule = negocio.schedules.find((s: any) => s.day === days[now.getDay()]);
    if (!todaySchedule || todaySchedule.is_closed) return { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    
    const parseTime = (t: string) => { const [h, m] = t.split(":"); return parseInt(h) * 60 + parseInt(m); };
    const cur = now.getHours() * 60 + now.getMinutes();
    const open = parseTime(todaySchedule.opening_time);
    const close = parseTime(todaySchedule.closing_time);
    const isOpen = close < open ? (cur >= open || cur <= close) : (cur >= open && cur <= close);
    
    return isOpen 
      ? { status: "Abierto ahora", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
      : { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
  };

  const businessStatus = getBusinessStatus();
  const sessionUserId = String((session as any)?.user?.id || "");
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  const isAdmin = (session as any)?.user?.role?.toLowerCase() === 'admin' || (session as any)?.user?.email === 'diegocristianalonso@gmail.com';
  const canManage = Boolean(isAdmin || (sessionUserId && ownerId && sessionUserId === ownerId));
  
  let isValidPremium = negocio?.is_premium || false;
  if (isValidPremium && negocio?.premium_valid_until && new Date() > new Date(negocio.premium_valid_until)) {
    isValidPremium = false;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      {canManage && (
        <div className="fixed bottom-24 right-8 z-50 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link href={`/portal/negocios/${negocio.slug}/editar`} className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-primary">
            <Settings className="w-5 h-5" />
            <span>Gestionar</span>
          </Link>
        </div>
      )}

      <NavigationFAB isVisible={showScrollTop} type="back" onClick={() => router.back()} />

      <BusinessHero negocio={negocio} businessStatus={businessStatus} />

      <BusinessActions 
        negocio={negocio} 
        isValidPremium={isValidPremium} 
        onTrackClick={trackClick} 
      />

      <section className="py-12 md:py-20 px-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-12 md:space-y-20">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-3xl font-serif font-bold text-white mb-6 italic">Sobre el <span className="text-primary">negocio</span></h3>
              <div 
                className="text-slate-300 text-lg leading-relaxed space-y-6" 
                dangerouslySetInnerHTML={{ __html: negocio.descripcion || "Descubrí la mejor atención y calidad." }} 
              />
            </div>
            <BookingWidget businessName={negocio.nombre} whatsappNumber={negocio.telefono_whatsapp || negocio.telefono} />
            <ReviewSection 
              negocioId={negocio.documentId} 
              ownerId={ownerId} 
              initialRating={negocio.rating} 
              initialCount={negocio.review_count} 
            />
          </div>

          <aside className="lg:col-span-1">
            <BusinessSidebar 
              negocio={negocio} 
              isValidPremium={isValidPremium} 
              session={session} 
              slug={slug} 
              setShowClaimModal={setShowClaimModal} 
              router={router} 
            />
          </aside>
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
