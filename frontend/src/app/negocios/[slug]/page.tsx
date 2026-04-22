"use client";

import { useEffect, useState, use } from "react";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import { Negocio } from "@/types/strapi";
import Navbar from "@/components/layout/Navbar";
import GoogleMap from "@/components/common/GoogleMap";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  Facebook, 
  ArrowLeft,
  Star,
  Clock,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
    if (autoClaim === "1" && session?.user && negocio) {
      setShowClaimModal(true);
      // Clean query params
      router.replace(`/negocios/${slug}`, { scroll: false });
    }
  }, [autoClaim, session, negocio, slug, router]);

  const handleClaimSubmit = async () => {
    if (!session) {
      router.push(`/registro?claim=${slug}`);
      return;
    }
    
    if (!claimFile) {
      setClaimErrorMessage("La documentación probatoria (DNI o Habilitación) es obligatoria.");
      setIsClaiming(false);
      return;
    }

    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
      const targetUrl = `${strapiUrl}/api/negocios/${negocio.documentId || negocio.id}/claim`;
      
      const formData = new FormData();
      formData.append("data", JSON.stringify({ message: claimMessage }));
      if (claimFile) {
        formData.append("documentacion_reclamo", claimFile);
      }
      
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.jwt}`
        },
        body: formData
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {}

      if (res.ok) {
        alert("¡Tu solicitud de reclamo ha sido enviada exitosamente!");
        setShowClaimModal(false);
        setNegocio((prev: any) => prev ? { ...prev, estado_reclamo: 'pendiente' } : prev);
      } else {
        setClaimErrorMessage(data.error?.message || "Error al enviar reclamo");
      }
    } catch (e) {
      setClaimErrorMessage("Error de conexión");
    } finally {
      setIsClaiming(false);
    }
  };

  const sanitizeText = (text: string): string => {
    if (!text.includes('Ã') && !text.includes('Â')) return text;
    try {
      const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
      return text;
    }
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      // Populate basic info
      const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url&populate[galeria][fields][0]=url&populate[schedules]=*";
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
      console.error("Error cargando negocio:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [slug]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Cargando experiencias...</p>
      </div>
    );
  }

  if (error || !negocio) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🏔️</div>
        <h1 className="text-3xl font-bold text-white mb-4">No encontramos este lugar</h1>
        <p className="text-slate-400 max-w-md mb-8 text-balance">
          El comercio que buscas no está disponible o la dirección es incorrecta.
        </p>
        <Link 
          href="/" 
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const logoUrl = negocio.logo?.url;
  const coverUrl = negocio.imagen_portada?.url;

  // Logic for "Abierto Ahora" (RF-11)
  const getBusinessStatus = () => {
    if (!negocio.schedules || negocio.schedules.length === 0) return null;

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todaySchedule = negocio.schedules.find((s: any) => s.day === currentDay);

    if (!todaySchedule || todaySchedule.is_closed) {
      return { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    }

    // Parse times (assuming format HH:mm:ss.SSS)
    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(":");
      return parseInt(h) * 60 + parseInt(m);
    };

    const openTime = parseTime(todaySchedule.opening_time);
    const closeTime = parseTime(todaySchedule.closing_time);

    // Handle overnight schedules (e.g. 12:00 to 02:00)
    const isCurrentlyOpen = closeTime < openTime
      ? (currentTime >= openTime || currentTime <= closeTime)
      : (currentTime >= openTime && currentTime <= closeTime);

    if (isCurrentlyOpen) {
      return { status: "Abierto ahora", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    }

    return { status: "Cerrado", color: "text-red-500 bg-red-500/10 border-red-500/20" };
  };

  const businessStatus = getBusinessStatus();

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {coverUrl ? (
          <img 
            src={getStrapiMedia(coverUrl)!} 
            alt={negocio.nombre}
            className="w-full h-full object-cover brightness-50"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        
        <div className="absolute top-28 left-4 md:left-8 z-10">
          <Link 
            href="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Volver</span>
          </Link>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 md:p-12 lg:p-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            {/* Logo Overlap */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-32 h-32 md:w-48 md:h-48 bg-background/90 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-2xl border border-white/10 shrink-0"
            >
              {logoUrl ? (
                <img 
                  src={getStrapiMedia(logoUrl)!} 
                  alt={negocio.nombre} 
                  className="w-full h-full rounded-[2rem] object-cover bg-white"
                />
              ) : (
                 <div className="w-full h-full bg-gradient-to-br from-primary to-secondary rounded-[2rem] flex items-center justify-center text-primary-foreground font-bold text-5xl">
                    {negocio.nombre.charAt(0)}
                 </div>
              )}
            </motion.div>

            <div className="flex-1 pb-4">
              <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-4 tracking-tight text-balance">
                {negocio.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                {businessStatus && (
                   <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", businessStatus.color)}>
                     {businessStatus.status}
                   </div>
                )}
                <div className="flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium">{negocio.direccion || "San Rafael, Mendoza"}</span>
                </div>
                {negocio.categoria && (
                  <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/30">
                    {negocio.categoria.nombre}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
                Descripción
                <div className="h-px flex-1 bg-white/5" />
              </h2>
              {negocio.descripcion ? (
                <div 
                  className="text-slate-400 leading-relaxed text-lg whitespace-pre-wrap mb-12"
                  dangerouslySetInnerHTML={{ __html: negocio.descripcion }}
                />
              ) : (
                /* Placeholder glassmorphic — se muestra si el negocio no tiene descripción */
                <div className="mb-12 p-8 rounded-3xl bg-white/3 border border-white/8 backdrop-blur-sm flex items-center gap-5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-2xl">🏔️</span>
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Descripción próximamente</p>
                    <p className="text-slate-500 text-sm">Estamos recopilando la información de este comercio. Volvé pronto.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Website Portlet - Prioridad sobre galería */}
            {negocio.website && (
              <WebsitePortlet 
                url={negocio.website} 
                businessName={negocio.nombre} 
              />
            )}

            {/* Gallery placeholder or actual images */}
            {negocio.galeria && negocio.galeria.length > 0 && (
              <div className="pt-8">
                <h2 className="text-2xl font-heading font-bold text-white mb-8 flex items-center gap-3">
                  Galería de Fotos
                  <div className="h-px flex-1 bg-white/5" />
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {negocio.galeria.map((img: any, i: number) => (
                    <motion.div 
                      key={img.id}
                      whileHover={{ scale: 1.02 }}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-xl border border-white/5"
                    >
                      <img 
                        src={getStrapiMedia(img.url)!} 
                        alt={`${negocio.nombre} ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Booking Widget Principal: Solo si está habilitado */}
            {negocio.reserva_habilitada && (
              <BookingWidget 
                reservaUrl={negocio.reserva_url} 
                whatsapp={negocio.whatsapp}
                businessName={negocio.nombre}
              />
            )}

            {/* Action Buttons */}
            <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-white/5 backdrop-blur-md shadow-xl sticky top-32">
              {/* Sección de Reclamo: Solo visible si no hay dueño y el estado es 'ninguno' */}
              {negocio.reclamar_habilitado && !negocio.owner && (!negocio.estado_reclamo || negocio.estado_reclamo === 'ninguno') && (
                <div className="mb-8 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <h4 className="text-white font-bold mb-2">¿Eres el dueño de este negocio?</h4>
                  <p className="text-sm text-blue-200/70 mb-4 text-balance">Reclama este perfil para administrar la información, responder comentarios y más.</p>
                  <button 
                    onClick={() => {
                      if (!session) router.push(`/registro?claim=${slug}`);
                      else setShowClaimModal(true);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Reclamar Perfil
                  </button>
                </div>
              )}
              
              {negocio.estado_reclamo === 'pendiente' && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-amber-400 font-bold text-sm">Tu solicitud de reclamo está pendiente de aprobación.</p>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-6">Información Detallada</h3>
              
              <div className="space-y-4">
                {negocio.telefono && (
                  <a href={`tel:${negocio.telefono}`} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500">Teléfono</p>
                         <p className="text-white font-medium">{negocio.telefono}</p>
                      </div>
                    </div>
                  </a>
                )}

                {negocio.whatsapp && (
                  <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" className="flex items-center justify-between p-4 bg-green-500/10 rounded-2xl hover:bg-green-500/20 transition-all border border-green-500/10 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-green-500/70">WhatsApp</p>
                         <p className="text-white font-medium">Chatear ahora</p>
                      </div>
                    </div>
                  </a>
                )}

                {/* Sitio Web removido del sidebar — cubierto por WebsitePortlet en columna principal */}
                
                <div className="pt-4 flex gap-4">
                  {negocio.instagram && (
                    <a href={negocio.instagram} target="_blank" className="flex-1 h-14 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1px] group transition-transform hover:scale-105">
                      <div className="w-full h-full bg-slate-900 rounded-[0.9rem] flex items-center justify-center text-white">
                        <Instagram className="w-6 h-6" />
                      </div>
                    </a>
                  )}
                  {negocio.facebook && (
                    <a href={negocio.facebook} target="_blank" className="flex-1 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white transition-transform hover:scale-105">
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>

              {/* Map Container */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold">Ubicación</h4>
                  <a 
                    href={negocio.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`} 
                    target="_blank"
                    className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    Ver en Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div data-testid="map-section" className="h-64">
                   {negocio.latitud && negocio.longitud ? (
                     <GoogleMap 
                        lat={negocio.latitud} 
                        lng={negocio.longitud} 
                        title={negocio.nombre}
                      />
                   ) : (
                     <div data-testid="location-not-found" className="w-full h-full bg-slate-800 rounded-3xl flex items-center justify-center p-6 text-center">
                        <p className="text-slate-500 text-sm italic">Ubicación no disponible en el mapa.</p>
                     </div>
                   )}
                </div>
              </div>

              {/* Horarios Card */}
              {negocio.horarios_texto && (
                <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold">Horarios Actualizados</span>
                  </div>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed">
                    {sanitizeText(negocio.horarios_texto)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setShowClaimModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
               ✕
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">Reclamar Negocio</h3>
            <p className="text-sm text-slate-400 mb-6">
              Estás a un paso de tomar control de <strong>{negocio.nombre}</strong>. 
              Déjanos un mensaje con tu número de teléfono o una forma de validar que eres el dueño o representante legal.
            </p>
            <textarea 
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              placeholder="Ej: Hola, soy el dueño de este local. Mi teléfono es 2604-XXXXXX."
              className="w-full h-24 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 mb-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Documentación de propiedad (PDF o imagen de DNI, Habilitación, AFIP, etc.)
              </label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="claim-file-upload"
                />
                <label 
                  htmlFor="claim-file-upload"
                  className="flex items-center justify-between px-4 py-3 bg-slate-800 border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors"
                >
                  <span className="text-sm text-slate-400 truncate max-w-[200px]">
                    {claimFile ? claimFile.name : "Seleccionar archivo..."}
                  </span>
                  <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase">
                    Subir
                  </div>
                </label>
                {claimFile && (
                  <button 
                    onClick={() => setClaimFile(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 ml-1 leading-tight">
                Adjunta una copia de tu inscripción fiscal, DNI o cualquier documento que acredite la propiedad.
              </p>
            </div>
            {claimErrorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center">
                {claimErrorMessage}
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-3 text-white font-bold bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                disabled={isClaiming}
              >
                Cancelar
              </button>
              <button 
                onClick={handleClaimSubmit}
                disabled={isClaiming}
                className="flex-1 py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isClaiming ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
