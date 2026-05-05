"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import CategoryGrid from "@/components/home/CategoryGrid";
import FilterBar from "@/components/home/FilterBar";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Negocio, Categoria } from "@/types/strapi";

// Helper para normalizar texto (quitar acentos, etc.)
const normalizeText = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Componente intermedio para manejar Suspense
function HomeContent() {
  const searchParams = useSearchParams();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Estados de Filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryDocId(id);
    if (id === null) {
      setSearchQuery(""); // Limpieza total cuando se elige "Todas" las categorías
    }
    setSelectionCount(prev => prev + 1);
  };

  // Sincronizar filtro desde la URL
  useEffect(() => {
    const catParam = searchParams.get("cat");
    if (catParam && categorias.length > 0) {
      const found = categorias.find(c => 
        normalizeText(c.nombre).includes(normalizeText(catParam)) || 
        c.documentId === catParam
      );
      if (found) {
        setSelectedCategoryDocId(found.documentId);
      }
    } else if (!catParam) {
      setSelectedCategoryDocId(null);
    }
  }, [searchParams, categorias]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const catRes = await fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc");
        setCategorias(catRes.data || []);

        let allNegocios: Negocio[] = [];
        let page = 1;
        let pageCount = 1;

        do {
          const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url&populate[owner][fields][0]=id";
          const negRes = await fetchFromStrapi(`negocios?${populate}&sort=nombre:asc&pagination[page]=${page}&pagination[pageSize]=100`);
          if (negRes.data) {
            allNegocios = [...allNegocios, ...negRes.data];
          }
          pageCount = negRes.meta?.pagination?.pageCount || 1;
          page++;
        } while (page <= pageCount);

        setNegocios(allNegocios);
      } catch (error) {
        console.error("Error cargando datos principales:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filterBarRef = useRef<HTMLDivElement>(null);

  // Scroll automático inteligente (Mejora UX Mobile)
  useEffect(() => {
    if (categorias.length === 0) return;

    const performScroll = () => {
      // Caso: Reset / Ver Todos (null)
      if (!selectedCategoryDocId) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
      if (!selectedCat) return;

      const hasSubcategories = categorias.some(c => c.parent?.documentId === selectedCategoryDocId);
      const isSubcategory = !!selectedCat.parent;
      
      const filterBarTop = filterBarRef.current?.getBoundingClientRect().top || 0;
      const isAlreadyAtFilters = filterBarTop < 150;

      if (hasSubcategories && !isSubcategory && !isAlreadyAtFilters) {
        filterBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        scrollToResults();
      }
    };

    const timer = setTimeout(performScroll, 100);
    return () => clearTimeout(timer);
  }, [selectionCount, categorias]);

  // Lógica de Filtrado Dinámico (Búsqueda Parcial Inteligente y Robusta)
  const filteredNegocios = negocios.filter((negocio) => {
    const normalizedQuery = normalizeText(searchQuery);
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    
    const bizName = normalizeText(negocio.nombre);
    const bizDesc = normalizeText(negocio.descripcion || "");

    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
      bizName.includes(term) || bizDesc.includes(term)
    );

    // Lógica de Subcategorías: Machear por NOMBRE (siempre disponible en la respuesta de Strapi)
    let validCategoryNames: string[] = [];
    if (selectedCategoryDocId) {
      const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
      if (selectedCat) validCategoryNames.push(selectedCat.nombre.toLowerCase());
      
      // Agregar todas las subcategorías que tengan como padre a la seleccionada
      categorias.forEach(c => {
        if (c.parent?.documentId === selectedCategoryDocId) {
          validCategoryNames.push(c.nombre.toLowerCase());
        }
      });
    }

    const matchesCategory = selectedCategoryDocId 
      ? validCategoryNames.includes((negocio.categoria?.nombre || "").toLowerCase())
      : true;

    return matchesSearch && matchesCategory;
  });

  const isFiltering = searchQuery.trim().length > 0 || !!selectedCategoryDocId;

  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[70vh] md:h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-40 md:pt-0">
        <HeroCarousel />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl z-10"
        >
          <h1 className="text-5xl md:text-8xl font-serif text-white leading-tight mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            Vive <span className="italic inline-block text-primary drop-shadow-[0_4px_20px_rgba(255,191,0,0.8)]">San Rafael</span>
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
                  placeholder="¿Qué buscas? (ej. Cabañas, Restaurantes)" 
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/40 text-sm md:text-base focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToResults()}
                />
              </div>
              <button 
                onClick={scrollToResults}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Explorar
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FILTER BAR STICKY */}
      <div id="filter-bar" ref={filterBarRef} className="scroll-mt-24">
        <FilterBar 
          categorias={categorias} 
          selectedCategoryDocId={selectedCategoryDocId} 
          onSelectCategory={handleSelectCategory} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 bg-background">
        
        <AnimatePresence mode="wait">
          {/* Eliminado bloque redundante de stats */}
        </AnimatePresence>

        {/* FEATURED PLACES / SEARCH RESULTS */}
        <section className="mt-20 scroll-mt-32" ref={resultsRef}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-4xl md:text-5xl font-serif font-extrabold text-white tracking-tight">
                  {isFiltering ? "Resultados de" : "Comercios"} <span className="text-primary italic font-medium">{isFiltering ? "tu búsqueda" : "Destacados"}</span>
                </h2>
                {isFiltering && (
                  <button 
                    onClick={() => handleSelectCategory(null)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/20 transition-all active:scale-95 animate-in fade-in slide-in-from-left-4"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    Ver todos / Buscar otro
                  </button>
                )}
              </div>
              <p className="text-slate-400">
                {isFiltering 
                  ? `Hemos encontrado ${filteredNegocios.length} opciones para vos en ${selectedCategoryDocId ? categorias.find(c => c.documentId === selectedCategoryDocId)?.nombre : "San Rafael"}.`
                  : "Seleccionamos las mejores opciones locales para que tu estadía en San Rafael sea inolvidable."}
              </p>
            </div>
          </div>

          <BusinessGrid 
            negocios={filteredNegocios} 
            loading={loading} 
            onClearFilters={() => { setSearchQuery(""); setSelectedCategoryDocId(null); }}
          />
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
