"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fetchFromStrapi } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import NavigationFAB from "@/components/layout/NavigationFAB";
import { motion, AnimatePresence } from "framer-motion";
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
  const [localidadQuery, setLocalidadQuery] = useState("");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estados Etapa 2
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryDocId(id);
    
    const params = new URLSearchParams(window.location.search);
    if (id) {
      const cat = categorias.find(c => c.documentId === id);
      if (cat) params.set("cat", cat.slug || cat.documentId);
      setSelectionCount(prev => prev + 1);
    } else {
      params.delete("cat");
      params.delete("q");
      setSearchQuery("");
      scrollToResults();
    }
    
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
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

  // Sincronizar filtros DESDE la URL al cargar y al navegar (Memoria de hierro)
  useEffect(() => {
    if (categorias.length === 0) return;

    const catParam = searchParams.get("cat");
    const qParam = searchParams.get("q");
    const lParam = searchParams.get("l");

    if (qParam !== null) {
      setSearchQuery(qParam);
    } else {
      setSearchQuery("");
    }

    if (lParam !== null) {
      setLocalidadQuery(lParam);
    } else {
      setLocalidadQuery("San Rafael, Mendoza");
    }
    
    if (catParam) {
      const found = categorias.find(c => 
        c.documentId === catParam ||
        c.slug === catParam ||
        normalizeText(c.nombre) === normalizeText(catParam)
      );
      if (found && found.documentId !== selectedCategoryDocId) {
        setSelectedCategoryDocId(found.documentId);
      }
    } else if (catParam === null && selectedCategoryDocId !== null) {
      setSelectedCategoryDocId(null);
    }
  }, [searchParams, categorias]); 

  // Auto-scroll a resultados cuando cambian los filtros (vía Navbar u otros)
  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("cat");
    const l = searchParams.get("l");
    
    if (q || cat || l) {
      // Pequeño timeout para asegurar que el DOM se haya actualizado si hay cambios de layout
      const timer = setTimeout(scrollToResults, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar búsqueda HACIA la URL (solo con debounce para el texto)
  useEffect(() => {
    if (categorias.length === 0) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const currentQ = params.get("q") || "";
      const currentL = params.get("l") || "";
      
      let changed = false;
      if (searchQuery !== currentQ) {
        if (searchQuery) params.set("q", searchQuery);
        else params.delete("q");
        changed = true;
      }

      if (localidadQuery !== currentL) {
        if (localidadQuery && localidadQuery !== "San Rafael, Mendoza") {
          params.set("l", localidadQuery);
        } else {
          params.delete("l");
        }
        changed = true;
      }
      
      if (changed) {
        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, localidadQuery, pathname, router, categorias]);

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
    // 1. Filtro de Búsqueda (Texto)
    const normalizedQuery = normalizeText(searchQuery);
    let matchesSearch = true;
    if (normalizedQuery.length > 0) {
      const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
      const bizName = normalizeText(negocio.nombre);
      const bizDesc = normalizeText(negocio.descripcion || "");
      const bizCat = normalizeText(negocio.categoria?.nombre || "");
      matchesSearch = searchTerms.every(term => 
        bizName.includes(term) || bizDesc.includes(term) || bizCat.includes(term)
      );
    }

    // 2. Filtro de Localidad (Dirección)
    let matchesLocation = true;
    if (localidadQuery && localidadQuery !== "San Rafael, Mendoza") {
      const normalizedLoc = normalizeText(localidadQuery);
      const locTerms = normalizedLoc.split(/[\s,]+/).filter(t => 
        t.length > 2 && !/^\d+$/.test(t) && !/^[A-Z]\d+/.test(t.toUpperCase())
      );
      
      if (locTerms.length > 0) {
        const bizAddress = normalizeText(negocio.direccion || "");
        matchesLocation = locTerms.some(term => bizAddress.includes(term));
      }
    }

    // 3. Filtro de Categoría de la barra
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

    return matchesSearch && matchesLocation && matchesBarCategory;
  });

  // El filtro final ya está unificado arriba
  const sortedNegocios = [...filteredNegocios].sort((a, b) => {
    if (!userLocation || !a.latitud || !a.longitud || !b.latitud || !b.longitud) return 0;
    const distA = getDistance(userLocation.lat, userLocation.lng, a.latitud, a.longitud);
    const distB = getDistance(userLocation.lat, userLocation.lng, b.latitud, b.longitud);
    return distA - distB;
  });

  const isFiltering = searchQuery.trim().length > 0 || selectedCategoryDocId !== null || (localidadQuery !== "" && localidadQuery !== "San Rafael, Mendoza");

  return (
    <main ref={topRef} className="min-h-screen">
      {/* HERO SECTION — Banner Panorámico sin texto para máxima limpieza */}
      <section className="relative h-[25vh] md:h-[35vh] flex flex-col items-center justify-center text-center px-4">
        <HeroCarousel />
        {/* El contenido de texto se eliminó para priorizar la visibilidad de los comercios */}
      </section>

      {/* FILTER BAR STICKY — subcategorías y estado de filtrado */}
      <div id="filter-bar" ref={filterBarRef} className="scroll-mt-36">
        <FilterBar 
          categorias={categorias} 
          selectedCategoryDocId={selectedCategoryDocId} 
          onSelectCategory={handleSelectCategory} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 bg-background">
        
        <AnimatePresence mode="wait">
          {/* Eliminado bloque redundante de stats */}
        </AnimatePresence>

        {/* FEATURED PLACES / SEARCH RESULTS — Espacio extra en móvil para compensar el Navbar expandido */}
        <section className="mt-36 md:mt-12 scroll-mt-48" ref={resultsRef}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-4xl md:text-5xl font-serif font-extrabold text-white tracking-tight">
                  Comercios <span className="text-primary italic font-medium">{isFiltering ? "Encontrados" : "Destacados"}</span>
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
