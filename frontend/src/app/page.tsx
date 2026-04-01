"use client";

import { useEffect, useState } from "react";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [negRes, catRes] = await Promise.all([
          fetchFromStrapi("negocios?populate=*&sort=nombre:asc&pagination[pageSize]=50"),
          fetchFromStrapi("categorias?populate=*&sort=nombre:asc")
        ]);
        setNegocios(negRes.data || []);
        setCategorias(catRes.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <HeroCarousel />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl z-10"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-white tracking-tight leading-tight mb-6">
            Vive <span className="text-primary italic">San Rafael</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto text-balance">
            Encuentra las mejores experiencias, gastronomía y alojamiento en el corazón de Mendoza.
          </p>

          {/* Search Bar Premium */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-background/60 backdrop-blur-2xl border border-white/20 p-2 rounded-full shadow-2xl">
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="¿Qué estás buscando hoy?" 
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-400 text-sm md:text-base"
                />
              </div>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-lg">
                Explorar
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 bg-background">
        {/* CATEGORIES */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold">Explorar por Categoría</h2>
            <button className="text-primary font-semibold flex items-center gap-2 hover:underline">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
              ))
            ) : (
              categorias.map((cat: any) => {
                const coverUrl = cat.imagen_portada?.url;
                return (
                  <motion.div 
                    key={cat.id} 
                    whileHover={{ scale: 1.02 }}
                    className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer"
                  >
                    {coverUrl ? (
                      <img src={getStrapiMedia(coverUrl)!} alt={cat.nombre} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-4xl opacity-50">🏔️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white">{cat.nombre}</h3>
                      <span className="text-xs text-slate-300 uppercase tracking-widest">{cat.negocios?.length || 0} Lugares</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* FEATURED PLACES */}
        <div>
          <h2 className="text-3xl font-heading font-bold mb-10 text-balance">Comercios Destacados</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : negocios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No se encontraron negocios aún. Asegúrate de que estén publicados en Strapi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {negocios.map((negocio: any) => {
                const attrs = negocio;
                const logoUrl = attrs.logo?.url;
                const coverUrl = attrs.imagen_portada?.url;
                
                return (
                  <motion.div 
                    key={negocio.id} 
                    whileHover={{ y: -10 }}
                    className="group bg-slate-900/50 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-xl"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {coverUrl ? (
                        <img 
                          src={getStrapiMedia(coverUrl)!} 
                          alt={attrs.nombre} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800" />
                      )}
                      
                      {/* Badge Category */}
                      <div className="absolute top-6 left-6 px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                        {attrs.categoria?.nombre || "General"}
                      </div>

                      {/* Logo Wrapper */}
                      <div className="absolute -bottom-8 right-8 w-20 h-20 bg-background p-1.5 rounded-full shadow-2xl border border-white/10">
                        {logoUrl ? (
                          <img 
                            src={getStrapiMedia(logoUrl)!} 
                            alt={attrs.nombre} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                            {attrs.nombre?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 pt-10">
                      <div className="flex items-center gap-1 text-secondary mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current opacity-50" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{attrs.nombre}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                        {attrs.descripcion 
                          ? attrs.descripcion.replace(/<[^>]*>?/gm, '')
                          : 'Experiencia única en San Rafael.'}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <span className="text-xs text-slate-500 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> {attrs.direccion || "San Rafael"}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
