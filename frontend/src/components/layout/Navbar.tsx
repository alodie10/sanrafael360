"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Search, User, LogOut, MapPin, ChevronDown, LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/Logo";
import { useSession, signOut } from "next-auth/react";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";
import { fetchFromStrapi } from "@/lib/strapi";
import { Loader } from "@googlemaps/js-api-loader";

function NavbarInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [localidad, setLocalidad] = useState("San Rafael, Mendoza");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isPlacesLoaded, setIsPlacesLoaded] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const activeCatParam = searchParams.get("cat");

  // --- Google Places Autocomplete ---
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !locationInputRef.current) return;
    const loader = new Loader({ apiKey, version: "weekly", libraries: ["places", "marker", "maps"], language: "es" });
    
    loader.load().then((google) => {
      const southMendozaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-36.2, -70.3),
        new google.maps.LatLng(-33.8, -67.2)
      );
      
      const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current!, {
        componentRestrictions: { country: "ar" },
        types: [], 
        fields: ["formatted_address", "geometry"],
        bounds: southMendozaBounds,
        strictBounds: true 
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          // Limpiamos la basura técnica (códigos postales, rutas) del texto que ve el usuario
          let clean = place.formatted_address.split(',')[0]; 
          clean = clean.replace(/M560\d/g, '') // Elimina M5600, M5603...
                       .replace(/RN\d+/g, '')  // Elimina RN143...
                       .replace(/RP\d+/g, '')  // Elimina RP173...
                       .trim();
          setLocalidad(clean || place.formatted_address.split(',')[0]);
        }
      });
      setIsPlacesLoaded(true);
    }).catch(() => {});
  }, []);

  // --- Cargar categorías ---
  useEffect(() => {
    setLoadingCats(true);
    fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100")
      .then((res) => {
        setCategorias(res.data || []);
        setLoadingCats(false);
      })
      .catch(() => setLoadingCats(false));
  }, []);

  // --- Sincronizar query y localidad desde URL ---
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    if (searchParams.get("l")) {
      setLocalidad(searchParams.get("l") || "San Rafael, Mendoza");
    } else if (!searchParams.get("cat") && !searchParams.get("q")) {
      setLocalidad("San Rafael, Mendoza");
    }
  }, [searchParams]);

  // --- Scroll listener ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Resetear estados al cambiar de página ---
  useEffect(() => {
    setScrolled(window.scrollY > 20);
    setIsOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // --- Cerrar dropdowns al clic fuera ---
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mainCategorias = categorias.filter((c) => {
    if (!c.parent) return true;
    if (typeof c.parent === 'object' && !(c.parent as any).documentId) return true;
    return false;
  });

  const getSubcategories = (parentId: string) => categorias.filter(c => {
    const pId = c.parent?.documentId || (c.parent as any)?.data?.documentId;
    return pId === parentId;
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (localidad.trim() && localidad !== "San Rafael, Mendoza") {
      params.set("l", localidad.trim());
    } else if (!searchQuery.trim()) {
      setLocalidad("San Rafael, Mendoza");
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setIsOpen(false);
  };

  const handleResetAll = () => {
    setSearchQuery("");
    setLocalidad("San Rafael, Mendoza");
    router.push("/");
    setIsOpen(false);
  };

  const handleCatSelect = (docId: string | null) => {
    setLocalidad("San Rafael, Mendoza");
    if (!docId) {
      handleResetAll();
      return;
    }
    const params = new URLSearchParams();
    const cat = categorias.find((c) => c.documentId === docId);
    params.set("cat", cat?.slug || docId);
    const currentQ = searchParams.get("q");
    if (currentQ) params.set("q", currentQ);
    router.push(`/?${params.toString()}`, { scroll: false });
    setActiveDropdown(null);
    setIsOpen(false);
  };

  const isHome = pathname === "/";

  const handleSearchInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setLocalidad("San Rafael, Mendoza");
  };

  const handleLocationInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <nav className={cn(
      "fixed left-0 right-0 z-[100] transition-all duration-500 top-[calc(var(--app-banner-height,0px)+var(--master-bar-height,0px))]",
      scrolled ? "bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl" : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Superior */}
        <div className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20">
          <div className="flex items-center gap-2">
            <Logo onClick={handleResetAll} className="hover:scale-105 transition-transform" />
            <span className="text-[10px] text-white/20 font-mono mt-4 hidden md:block">
              {process.env.NEXT_PUBLIC_APP_VERSION || "v1.1"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {!session ? (
              <Link href="/login" className="text-white/70 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Ingresar
              </Link>
            ) : (
              <button 
                onClick={() => signOut()}
                className="text-white/70 hover:text-white text-sm font-bold transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Salir
              </button>
            )}
            <Link href="/contacto" className="bg-primary text-black px-6 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)]">Vende aquí</Link>
          </div>
          <div className="flex items-center gap-4 md:hidden">
            {!session ? (
              <Link href="/login" className="text-white p-1">
                <User className="w-7 h-7 text-primary" />
              </Link>
            ) : (
              <button onClick={() => signOut()} className="text-white p-1">
                <LogOut className="w-7 h-7 text-rose-500" />
              </button>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              <Menu className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y categorías */}
        <AnimatePresence>
          {(isHome || scrolled) && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-black/40 backdrop-blur-md border-t border-white/5 pb-6">
              <div className="px-4 pt-4 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-stretch bg-zinc-900/90 border border-white/10 rounded-xl overflow-hidden max-w-4xl w-full mx-auto shadow-2xl">
                  {/* Qué buscas */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-white/10 relative group">
                    <Search className="w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="¿Qué buscas?" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      onFocus={handleSearchInputFocus}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                      className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0 font-medium pr-8" 
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                    )}
                  </div>

                  {/* Dónde */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 relative group">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <input 
                      ref={locationInputRef} 
                      type="text" 
                      placeholder="Localidad" 
                      value={localidad} 
                      onChange={(e) => setLocalidad(e.target.value)} 
                      onFocus={handleLocationInputFocus}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                      className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0 font-medium pr-8" 
                    />
                    {localidad !== "San Rafael, Mendoza" && (
                      <button onClick={() => setLocalidad("San Rafael, Mendoza")} className="absolute right-3 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <button onClick={handleSearch} className="bg-white hover:bg-zinc-200 text-black px-10 py-4 md:py-0 font-heading font-black uppercase tracking-widest transition-all active:scale-95">BUSCAR</button>
                </div>

                <div ref={dropdownRef} className="flex items-center justify-center flex-wrap gap-x-6 gap-y-3 max-w-6xl mx-auto">
                  {loadingCats ? (
                    <div className="flex items-center gap-2 text-slate-500 py-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs font-bold uppercase">Cargando...</span></div>
                  ) : (
                    <>
                      {mainCategorias.map((cat) => {
                        const subCats = getSubcategories(cat.documentId);
                        const isOpen = activeDropdown === cat.documentId;
                        const isActive = activeCatParam === cat.slug || activeCatParam === cat.documentId;
                        return (
                          <div key={cat.id} className="relative">
                            <button onClick={() => subCats.length ? setActiveDropdown(isOpen ? null : cat.documentId) : handleCatSelect(cat.documentId)} className={cn("flex items-center gap-1.5 text-[13px] font-bold py-1 border-b-2 transition-all", isActive ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-white")}>
                              {cat.nombre} {subCats.length > 0 && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />}
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-3 min-w-[240px] bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-[200] p-2">
                                  <button onClick={() => handleCatSelect(cat.documentId)} className="w-full text-left px-4 py-3 text-[13px] font-black text-primary hover:bg-white/5 rounded-lg mb-1">Ver todo en {cat.nombre}</button>
                                  <div className="h-px bg-white/5 my-1" />
                                  {subCats.map(sub => (
                                    <button key={sub.id} onClick={() => handleCatSelect(sub.documentId)} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">{sub.nombre}</button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return <Suspense fallback={<div className="h-16 md:h-20 bg-black w-full fixed top-0 z-50 border-b border-white/5 shadow-2xl" />}><NavbarInner /></Suspense>;
}
