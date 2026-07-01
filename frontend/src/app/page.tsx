"use client";

import { useEffect, useState, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { fetchFromStrapi } from "@/lib/strapi";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import OffersBanner from "@/components/home/OffersBanner";
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

// Helper para verificar si un negocio tiene Premium activo y vigente
const isPremiumActive = (negocio: Negocio): boolean => {
  if (!negocio.is_premium) return false;
  if (!negocio.premium_valid_until) return true; // Sin vencimiento = activo
  return new Date(negocio.premium_valid_until) > new Date();
};

// Componente intermedio para manejar Suspense
function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Filtros como estado reactivo sincronizados con la URL mediante eventos
  const [searchQuery, setSearchQuery] = useState("");
  const [localidadQuery, setLocalidadQuery] = useState("");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estados Etapa 2
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // --- LÓGICA ETAPA 3: ALGOLIA SEARCH ---
  const [algoliaHits, setAlgoliaHits] = useState<any[] | null>(null);
  const [isSearchingAlgolia, setIsSearchingAlgolia] = useState(false);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryDocId(id);
    setSearchQuery(""); // Force instant clear
    setLocalidadQuery(""); // Force instant clear
    
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      const cat = categorias.find(c => c.documentId === id);
      if (cat) params.set("cat", cat.slug || cat.documentId);
      params.delete("q"); // Limpiar texto al seleccionar categoría
      params.delete("l"); // Limpiar localidad también
    } else {
      params.delete("cat");
      params.delete("q");
      params.delete("l");
      scrollToResults();
    }
    
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    
    // Forzar reseteo y sincronización del Navbar e inputs de inmediato
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("query-params-changed", {
        detail: {
          q: "",
          l: "",
          cat: params.get("cat") || ""
        }
      }));
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

  // Sincronizar todos los estados desde la URL y mediante eventos globales
  useEffect(() => {
    if (categorias.length === 0) return;

    const syncFromUrl = (e?: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        // Leer directamente desde el detalle del evento para evitar condiciones de carrera
        // con la navegación asíncrona de Next.js (router.push)
        const qVal = customEvent.detail.q || "";
        const lVal = customEvent.detail.l || "";
        const catVal = customEvent.detail.cat || "";

        setSearchQuery(qVal);
        setLocalidadQuery(lVal);

        if (catVal) {
          const found = categorias.find(c => c.documentId === catVal || c.slug === catVal);
          setSelectedCategoryDocId(found ? found.documentId : null);
        } else {
          setSelectedCategoryDocId(null);
        }
        return;
      }

      // Fallback para popstate (atrás/adelante) o carga inicial
      // Usamos el searchParams reactivo siempre que podamos, pero si estamos en popstate usamos location
      const paramsString = e && e.type === "popstate" ? window.location.search : searchParams.toString();
      const params = new URLSearchParams(paramsString);
      setSearchQuery(params.get("q") || "");
      setLocalidadQuery(params.get("l") || "");

      const catParam = params.get("cat") || params.get("categoria");
      if (catParam) {
        const found = categorias.find(c => 
          c.documentId === catParam ||
          c.slug === catParam ||
          normalizeText(c.nombre) === normalizeText(catParam)
        );
        if (found) {
          setSelectedCategoryDocId(found.documentId);
        } else {
          setSelectedCategoryDocId(null);
        }
      } else {
        setSelectedCategoryDocId(null);
      }
    };

    syncFromUrl();

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("query-params-changed", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("query-params-changed", syncFromUrl);
    };
  }, [categorias]);

  // Dispatch inicial al cargar la página para que el Navbar esté en sincronía total
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("query-params-changed", {
        detail: {
          q: searchParams.get("q") || "",
          l: searchParams.get("l") || "",
          cat: searchParams.get("cat") || searchParams.get("categoria") || ""
        }
      }));
    }
  }, [searchParams]);

  // Auto-scroll a resultados cuando cambian los filtros de texto o localidad
  useEffect(() => {
    const q = searchParams.get("q");
    const l = searchParams.get("l");
    if (q || l) {
      const timer = setTimeout(scrollToResults, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Búsqueda en Algolia (Ahora es el motor principal, carga instantánea)
  useEffect(() => {
    const performSearch = async () => {
      setIsSearchingAlgolia(true);
      try {
        const { algoliasearch } = await import('algoliasearch');
        const client = algoliasearch(
          process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
          process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ''
        );
        
        let fullQuery = `${searchQuery} ${localidadQuery}`.trim();

        if (selectedCategoryDocId) {
           const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
           if (selectedCat) {
             fullQuery = `${fullQuery} ${selectedCat.nombre}`.trim();
           }
        }

        const { results } = await client.search({
          requests: [
            {
              indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || (process.env.NODE_ENV === 'production' ? 'negocios' : 'negocios_dev'),
              query: fullQuery,
              hitsPerPage: 100,
            }
          ]
        });
        
        // Aseguramos que los Premium aparezcan primero en los resultados locales
        const hits = (results[0] as any)?.hits || [];
        const sortedHits = hits.sort((a: any, b: any) => {
          if (a.is_premium && !b.is_premium) return -1;
          if (!a.is_premium && b.is_premium) return 1;
          return 0;
        });
        setAlgoliaHits(sortedHits);
      } catch (e) {
        console.error("Algolia search error:", e);
        setAlgoliaHits(null); 
      } finally {
        setIsSearchingAlgolia(false);
      }
    };
    
    // Debounce de 300ms
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, localidadQuery, selectedCategoryDocId, categorias]);



  useEffect(() => {
    const CACHE_KEY_CATEGORIAS = "sr360_categorias_cache";
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    const loadData = async () => {
      try {
        setLoading(true);

        // — Intentar usar caché de sessionStorage solo para Categorías —
        try {
          const cachedC = sessionStorage.getItem(CACHE_KEY_CATEGORIAS);
          if (cachedC) {
            const { data: catData, ts: catTs } = JSON.parse(cachedC);
            const now = Date.now();
            if (now - catTs < CACHE_TTL_MS) {
              setCategorias(catData);
              setLoading(false);
              return; 
            }
          }
        } catch (_) { }

        // — Cargar Categorías desde Strapi —
        const catRes = await fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100");
        const catData = catRes.data || [];
        setCategorias(catData);

        try {
          sessionStorage.setItem(CACHE_KEY_CATEGORIAS, JSON.stringify({ data: catData, ts: Date.now() }));
        } catch (_) { }

      } catch (error) {
        console.error("Error cargando categorías:", error);
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
      const params = new URLSearchParams(searchParams.toString());
      if (transcript.trim()) {
        params.set("q", transcript.trim());
      } else {
        params.delete("q");
      }
      params.delete("cat");
      params.delete("categoria");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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

  // Lógica de Filtrado Dinámico (Algolia Headless)
  const filteredNegocios = useMemo(() => {
    if (!algoliaHits) return [];
    
    // Mapeamos los resultados de Algolia a la estructura Negocio que espera BusinessCard
    return algoliaHits.map(hit => ({
      documentId: hit.objectID,
      slug: hit.slug,
      nombre: hit.nombre,
      direccion: hit.direccion,
      is_premium: hit.is_premium,
      premium_valid_until: hit.premium_valid_until,
      categoria: hit.categoria ? { nombre: hit.categoria } : undefined,
      atributos: hit.atributos_ui || [], // Mapeado desde nuestro script
      price_range: hit.price_range,
      rating: hit.rating,
      review_count: hit.review_count,
      google_rating: hit.google_rating,
      google_review_count: hit.google_review_count,
      tripadvisor_rating: hit.tripadvisor_rating,
      tripadvisor_review_count: hit.tripadvisor_review_count,
      imagen_portada: hit.imagen_portada || null,
      logo: hit.logo || null,
      owner: hit.owner || null,
      latitud: hit.latitud,
      longitud: hit.longitud,
      ofertas: hit.ofertas || []
    })) as Negocio[];
  }, [algoliaHits]);

  // El filtro final ya está unificado arriba
  const sortedNegocios = useMemo(() => {
    return [...filteredNegocios].sort((a, b) => {
      const isAPremium = isPremiumActive(a);
      const isBPremium = isPremiumActive(b);

      if (isAPremium && !isBPremium) return -1;
      if (!isAPremium && isBPremium) return 1;

      // Desempate por distancia si está disponible
      if (userLocation && a.latitud && a.longitud && b.latitud && b.longitud) {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.latitud, a.longitud);
        const distB = getDistance(userLocation.lat, userLocation.lng, b.latitud, b.longitud);
        return distA - distB;
      }

      // Desempate alfabético por defecto
      return a.nombre.localeCompare(b.nombre);
    });
  }, [filteredNegocios, userLocation]);

  const isFiltering = searchQuery.trim().length > 0 || selectedCategoryDocId !== null || (localidadQuery !== "" && localidadQuery !== "San Rafael, Mendoza");

  return (
    <main ref={topRef} className="min-h-screen">
      {/* HERO SECTION — Banner Panorámico sin texto para máxima limpieza */}
      <section className="relative h-[25vh] md:h-[35vh] flex flex-col items-center justify-center text-center px-4">
        <HeroCarousel />
        {/* El contenido de texto se eliminó para priorizar la visibilidad de los comercios */}
      </section>

      {/* FILTER BAR STICKY — subcategorías y estado de filtrado */}
      <div id="filter-bar" ref={filterBarRef} className="sticky-filter-bar scroll-mt-36">
        <FilterBar 
          categorias={categorias} 
          selectedCategoryDocId={selectedCategoryDocId} 
        />
        <OffersBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 bg-background">
        
        <AnimatePresence mode="wait">
          {/* Eliminado bloque redundante de stats */}
        </AnimatePresence>

        {/* FEATURED PLACES / SEARCH RESULTS */}
        <section className="mt-4 scroll-mt-64" ref={resultsRef}>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Comercios <span className="text-primary italic">{isFiltering ? "Encontrados" : "Destacados"}</span>
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-white/[0.04] border border-white/[0.08] rounded-full px-2.5 py-0.5">
                {sortedNegocios.length}
              </span>
            </div>
            {isFiltering && (
              <p className="text-xs text-slate-500 hidden md:block">
                {selectedCategoryDocId
                  ? `En ${categorias.find(c => c.documentId === selectedCategoryDocId)?.nombre}`
                  : "San Rafael, Mendoza"}
              </p>
            )}
          </div>
          <BusinessGrid 
            negocios={sortedNegocios} 
            loading={loading || isSearchingAlgolia} 
            emptyMessage={
              searchQuery 
                ? "No encontramos negocios exactos, probá buscar con otras palabras o sinónimos."
                : "No hay negocios en esta categoría."
            }
            onClearFilters={() => handleSelectCategory(null)}
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
