"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import CategoryGrid from "@/components/home/CategoryGrid";
import FilterBar from "@/components/home/FilterBar";
import NavigationFAB from "@/components/layout/NavigationFAB";
import { Search, MapPin, Star, ArrowRight, Mic, MicOff, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Negocio, Categoria } from "@/types/strapi";
import { useRouter, usePathname } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Estados de Filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estados Etapa 2
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryDocId(id);
    if (id === null) {
      setSearchQuery(""); 
      // Cuando se toca "Todas" en la barra, el usuario quiere ver los resultados
      scrollToResults();
    } else {
      // Para categorías específicas, usamos el contador para el scroll inteligente
      setSelectionCount(prev => prev + 1);
    }
  };

  // Detector de scroll para el botón flotante
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar el botón si pasamos los 600px de scroll
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sincronizar filtros DESDE la URL al cargar y al navegar (Memoria corregida)
  useEffect(() => {
    const catParam = searchParams.get("cat");
    const queryParam = searchParams.get("q");

    if (queryParam) setSearchQuery(queryParam);
    else setSearchQuery("");
    
    if (catParam && categorias.length > 0) {
      const found = categorias.find(c => 
        normalizeText(c.nombre).includes(normalizeText(catParam)) || 
        c.documentId === catParam ||
        c.slug === catParam
      );
      if (found) {
        setSelectedCategoryDocId(found.documentId);
      }
    } else {
      setSelectedCategoryDocId(null);
    }
  }, [searchParams, categorias]); // Agregado searchParams para detectar navegación atrás/adelante

  // Sincronizar filtros HACIA la URL al cambiar (con debounce para la búsqueda)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategoryDocId) {
        const cat = categorias.find(c => c.documentId === selectedCategoryDocId);
        if (cat) params.set("cat", cat.slug || cat.documentId);
      }
      
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      
      // Solo actualizamos si la URL cambió para evitar loops de renderizado
      if (window.location.search !== `?${queryString}` && (window.location.search !== "" || queryString !== "")) {
        router.replace(newUrl, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryDocId, pathname, router, categorias]);

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

  // --- LÓGICA ETAPA 2: VOZ Y UBICACIÓN ---
  
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta búsqueda por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      scrollToResults();
    };

    recognition.start();
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        scrollToResults();
      },
      (err) => console.error("Error obteniendo ubicación:", err)
    );
  };

  // Haversine formula para distancia
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filterBarRef = useRef<HTMLDivElement>(null);

  // Scroll automático inteligente (Mejora UX Mobile)
  useEffect(() => {
    // Solo scrollear si hay categorías, HUBO un clic (count > 0) y NO es el caso null (que se maneja arriba)
    if (categorias.length === 0 || selectionCount === 0 || !selectedCategoryDocId) return;

    const performScroll = () => {
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

  // Lógica de Filtrado Dinámico (Búsqueda Universal Nativa - Etapa 1)
  const filteredNegocios = negocios.filter((negocio) => {
    const normalizedQuery = normalizeText(searchQuery);
    if (normalizedQuery.length === 0) {
      // Si no hay búsqueda de texto, solo aplicamos el filtro de categoría (si existe)
      if (!selectedCategoryDocId) return true;
      
      const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
      const bizCatName = (negocio.categoria?.nombre || "").toLowerCase();
      
      let validCategoryNames = [selectedCat?.nombre.toLowerCase()];
      categorias.forEach(c => {
        if (c.parent?.documentId === selectedCategoryDocId) {
          validCategoryNames.push(c.nombre.toLowerCase());
        }
      });
      return validCategoryNames.includes(bizCatName);
    }

    // Si hay búsqueda de texto, buscamos en Nombre, Descripción Y Categoría
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    
    const bizName = normalizeText(negocio.nombre);
    const bizDesc = normalizeText(negocio.descripcion || "");
    const bizCat = normalizeText(negocio.categoria?.nombre || "");

    const matchesSearch = searchTerms.every(term => 
      bizName.includes(term) || 
      bizDesc.includes(term) || 
      bizCat.includes(term)
    );

    // Si además hay una categoría seleccionada en la barra, aplicamos esa restricción extra
    let matchesBarCategory = true;
    if (selectedCategoryDocId) {
      const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
      const bizCatName = (negocio.categoria?.nombre || "").toLowerCase();
      let validCategoryNames = [selectedCat?.nombre.toLowerCase()];
      categorias.forEach(c => {
        if (c.parent?.documentId === selectedCategoryDocId) {
          validCategoryNames.push(c.nombre.toLowerCase());
        }
      });
      matchesBarCategory = validCategoryNames.includes(bizCatName);
    }

    return matchesSearch && matchesBarCategory;
  });

  // Ordenar por cercanía si tenemos la ubicación del usuario
  const sortedNegocios = [...filteredNegocios].sort((a, b) => {
    if (!userLocation || !a.latitud || !a.longitud || !b.latitud || !b.longitud) return 0;
    const distA = getDistance(userLocation.lat, userLocation.lng, a.latitud, a.longitud);
    const distB = getDistance(userLocation.lat, userLocation.lng, b.latitud, b.longitud);
    return distA - distB;
  });

  const isFiltering = searchQuery.trim().length > 0 || selectedCategoryDocId !== null;

  return (
    <main ref={topRef} className="min-h-screen">
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

          {/* Search Bar Premium con Voz y Ubicación (Refinado) */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-background/60 backdrop-blur-2xl border border-white/20 p-1.5 md:p-2 rounded-full shadow-2xl">
              <div className="flex-1 flex items-center px-3 md:px-4 gap-2 md:gap-3 min-w-0">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder={isListening ? "Escuchando..." : "¿Qué buscas?"}
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/40 text-sm md:text-base focus:ring-0 truncate"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToResults()}
                />
              </div>
              <div className="flex items-center gap-0.5 md:gap-1 pr-1">
                <button 
                  onClick={handleVoiceSearch}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isListening ? "bg-primary text-black animate-pulse" : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                  title="Buscar por voz"
                >
                  {isListening ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
                <button 
                  onClick={handleGetLocation}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    userLocation ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                  title="Cerca de mí"
                >
                  <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button 
                  onClick={scrollToResults}
                  className="bg-primary text-primary-foreground ml-1 p-3 md:px-6 md:py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                >
                  <span className="hidden md:inline mr-2 text-sm md:text-base">Explorar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
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
              </div>
              <p className="text-slate-400">
                {isFiltering 
                  ? `Hemos encontrado ${filteredNegocios.length} opciones para vos en ${selectedCategoryDocId ? categorias.find(c => c.documentId === selectedCategoryDocId)?.nombre : "San Rafael"}.`
                  : "Seleccionamos las mejores opciones locales para que tu estadía en San Rafael sea inolvidable."}
              </p>
            </div>
          </div>

          <BusinessGrid 
            negocios={sortedNegocios} 
            loading={loading} 
            onClearFilters={() => { setSearchQuery(""); setSelectedCategoryDocId(null); setUserLocation(null); }}
          />
        </section>
      </div>
      {/* SISTEMA DE NAVEGACIÓN UNIFICADO (ETAPA 3) */}
      <NavigationFAB 
        isVisible={showScrollTop}
        type={isFiltering ? 'reset' : 'top'}
        onClick={() => {
          if (isFiltering) {
            handleSelectCategory(null);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
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
