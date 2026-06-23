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
  const [negocios, setNegocios] = useState<Negocio[]>([]);
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


  useEffect(() => {
    const CACHE_KEY_NEGOCIOS = "sr360_negocios_cache";
    const CACHE_KEY_CATEGORIAS = "sr360_categorias_cache";
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    const loadData = async () => {
      try {
        setLoading(true);

        // — Intentar usar caché de sessionStorage —
        try {
          const cachedN = sessionStorage.getItem(CACHE_KEY_NEGOCIOS);
          const cachedC = sessionStorage.getItem(CACHE_KEY_CATEGORIAS);
          if (cachedN && cachedC) {
            const { data: negData, ts: negTs } = JSON.parse(cachedN);
            const { data: catData, ts: catTs } = JSON.parse(cachedC);
            const now = Date.now();
            if (now - negTs < CACHE_TTL_MS && now - catTs < CACHE_TTL_MS) {
              setNegocios(negData);
              setCategorias(catData);
              setLoading(false);
              return; // Datos frescos en caché — no llamamos a Strapi
            }
          }
        } catch (_) { /* sessionStorage no disponible */ }

        // — Cargar desde Strapi —
        const catRes = await fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100");
        const catData = catRes.data || [];
        setCategorias(catData);

        let allNegocios: Negocio[] = [];
        let page = 1;
        let pageCount = 1;

        do {
          const fields = "fields[0]=nombre&fields[1]=slug&fields[2]=direccion&fields[3]=latitud&fields[4]=longitud&fields[5]=is_premium&fields[6]=premium_valid_until&fields[7]=rating&fields[8]=review_count&fields[9]=google_rating&fields[10]=google_review_count&fields[11]=tripadvisor_rating&fields[12]=tripadvisor_review_count&fields[13]=estado_reclamo";
          const populate = "populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&populate[atributos][fields][0]=nombre&populate[atributos][fields][1]=tipo&populate[logo][fields][0]=url&populate[imagen_portada][fields][0]=url&populate[owner][fields][0]=id";
          const negRes = await fetchFromStrapi(`negocios?${fields}&${populate}&sort=nombre:asc&pagination[page]=${page}&pagination[pageSize]=25`);
          if (negRes.data) {
            allNegocios = [...allNegocios, ...negRes.data];
          }
          pageCount = negRes.meta?.pagination?.pageCount || 1;
          page++;
        } while (page <= pageCount);

        // — Pre-computar strings de búsqueda para rendimiento extremo —
        const processedNegocios = allNegocios.map(negocio => {
          const bizName = negocio.nombre || "";
          const bizCat = negocio.categoria?.nombre || "";
          const bizAttrs = (negocio.atributos || []).map((a: any) => a.nombre).join(" ");
          
          return {
            ...negocio,
            _searchString: normalizeText(`${bizName} ${bizCat} ${bizAttrs}`)
          };
        });

        setNegocios(processedNegocios);

        // — Guardar en caché —
        try {
          sessionStorage.setItem(CACHE_KEY_NEGOCIOS, JSON.stringify({ data: processedNegocios, ts: Date.now() }));
          sessionStorage.setItem(CACHE_KEY_CATEGORIAS, JSON.stringify({ data: catData, ts: Date.now() }));
        } catch (_) { /* sessionStorage lleno o no disponible */ }

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

  // Lógica de Filtrado Dinámico (Búsqueda Universal Nativa - Etapa 1)
  const filteredNegocios = React.useMemo(() => {
    return negocios.filter((negocio) => {
      // 1. Filtro de Búsqueda (Texto)
      const normalizedQuery = normalizeText(searchQuery);
      let matchesSearch = true;
      if (normalizedQuery.length > 0) {
        const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
        const searchStr = (negocio as any)._searchString || "";
        matchesSearch = searchTerms.every(term => searchStr.includes(term));
      }

      // 2. Filtro de Localidad (Dirección)
      let matchesLocation = true;
      if (localidadQuery && localidadQuery !== "San Rafael, Mendoza") {
        const normalizedLoc = normalizeText(localidadQuery.split(',')[0]); // Solo el distrito
        const locTerms = normalizedLoc.split(/\s+/).filter(t => 
          t.length > 2 && 
          !["mendoza", "argentina", "rafael", "rn143", "rp173", "m5600", "m5603"].includes(t) &&
          !/^[a-z]\d+/.test(t) && // Excluye códigos tipo M5600
          !/^\d+$/.test(t)
        );
        
        if (locTerms.length > 0) {
          const bizDir = normalizeText(negocio.direccion || "");
          const bizLoc = normalizeText((negocio as any).localidad || "");
          
          matchesLocation = locTerms.every(term => 
            bizDir.includes(term) || bizLoc.includes(term)
          );
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
        
        // Permitir coincidencia si el negocio tiene un atributo (tag) con el mismo nombre que la categoría
        if (!matchesBarCategory && negocio.atributos) {
          const bizAttrs = negocio.atributos.map((a: any) => (a.nombre || "").toLowerCase());
          const hasMatchingAttr = validCategoryNames.some(catName => catName && bizAttrs.includes(catName));
          if (hasMatchingAttr) {
            matchesBarCategory = true;
          }
        }
      }

      return matchesSearch && matchesLocation && matchesBarCategory;
    });
  }, [negocios, searchQuery, localidadQuery, selectedCategoryDocId, categorias]);

  // El filtro final ya está unificado arriba
  const sortedNegocios = React.useMemo(() => {
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
                {isFiltering ? filteredNegocios.length : negocios.length}
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
            loading={loading} 
            onClearFilters={() => {
              setSelectedCategoryDocId(null);
              setUserLocation(null);
              router.push(pathname, { scroll: false });
            }}
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
