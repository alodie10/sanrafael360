"use client";

import { useEffect, useState } from "react";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import CategoryGrid from "@/components/home/CategoryGrid";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Negocio, Categoria } from "@/types/strapi";

export default function Home() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">Explorar por Categoría</h2>
              <p className="text-slate-400 text-sm">Descubre San Rafael según tus intereses y necesidades.</p>
            </div>
            <button className="text-primary font-bold flex items-center gap-2 hover:underline group text-sm md:text-base">
              Ver todas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <CategoryGrid categorias={categorias} loading={loading} />
        </div>

        {/* FEATURED PLACES */}
        <section className="mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-4">
                Comercios <span className="text-primary italic font-medium">Destacados</span>
              </h2>
              <p className="text-slate-400">
                Seleccionamos las mejores opciones locales para que tu estadía en San Rafael sea inolvidable.
              </p>
            </div>
            <button className="text-slate-200 hover:text-primary transition-all text-sm font-bold flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 hover:border-primary/50 group">
              Explorar Guía Completa <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <BusinessGrid negocios={negocios} loading={loading} />
        </section>
      </div>
    </main>
  );
}
