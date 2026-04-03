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
  MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        setLoading(true);
        // Intentar buscar por slug o por documentId como fallback
        const res = await fetchFromStrapi(`negocios?filters[slug][$eq]=${slug}&populate=*`);
        
        let businessData = res.data?.[0];
        
        if (!businessData) {
          // Fallback: buscar por documentId si el slug no coincide
          const resById = await fetchFromStrapi(`negocios?filters[documentId][$eq]=${slug}&populate=*`);
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

    loadBusiness();
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
              <div className="flex items-center gap-2 text-secondary mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                <span className="text-white/60 text-sm ml-2 font-medium">(4.8 / 5.0)</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-4 tracking-tight">
                {negocio.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
                Descripción
                <div className="h-px flex-1 bg-white/5" />
              </h2>
              <div 
                className="text-slate-400 leading-relaxed text-lg whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: negocio.descripcion || "Sin descripción disponible." }}
              />
            </div>

            {/* Gallery placeholder or actual images */}
            {negocio.galeria && negocio.galeria.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-8 flex items-center gap-3">
                  Galería de Fotos
                  <div className="h-px flex-1 bg-white/5" />
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {negocio.galeria.map((img, i) => (
                    <motion.div 
                      key={img.id}
                      whileHover={{ scale: 1.02 }}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer"
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
            {/* Action Buttons */}
            <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-white/5 backdrop-blur-md shadow-xl sticky top-32">
              <h3 className="text-xl font-bold text-white mb-6">Contacto y Reservas</h3>
              
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

                {negocio.sitio_web && (
                  <a href={negocio.sitio_web} target="_blank" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500">Sitio Web</p>
                         <p className="text-white font-medium text-sm truncate max-w-[150px]">Visitar sitio</p>
                      </div>
                    </div>
                  </a>
                )}
                
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
                    href={`https://www.google.com/maps/search/?api=1&query=${negocio.latitud},${negocio.longitud}`} 
                    target="_blank"
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    Ver en Google Maps
                  </a>
                </div>
                <div className="h-64">
                   {negocio.latitud && negocio.longitud ? (
                     <GoogleMap 
                        lat={negocio.latitud} 
                        lng={negocio.longitud} 
                        title={negocio.nombre}
                      />
                   ) : (
                     <div className="w-full h-full bg-slate-800 rounded-3xl flex items-center justify-center p-6 text-center">
                        <p className="text-slate-500 text-sm italic">Ubicación no disponible en el mapa para este comercio.</p>
                     </div>
                   )}
                </div>
              </div>

              {/* Horarios Card */}
              {negocio.horarios && (
                <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold">Horarios</span>
                  </div>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap">
                    {negocio.horarios}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
