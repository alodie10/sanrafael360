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
    const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"], language: "es" });
    loader.load().then((google) => {
      const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current!, {
        componentRestrictions: { country: "ar" },
        types: ["(cities)"],
        fields: ["formatted_address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) setLocalidad(place.formatted_address);
      });
      setIsPlacesLoaded(true);
    }).catch(() => {});
  }, []);

  // --- Cargar categorías ---
  useEffect(() => {
    fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100")
      .then((res) => setCategorias(res.data || []))
      .catch(() => {});
  }, []);

  // --- Sincronizar query desde URL ---
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // --- Scroll listener ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const mainCategorias = categorias.filter((c) => !c.parent);
  const getSubcategories = (parentId: string) => categorias.filter(c => c.parent?.documentId === parentId);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    
    // Mantener la categoría actual si existe
    const currentCat = searchParams.get("cat");
    if (currentCat) params.set("cat", currentCat);

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setIsOpen(false);
  };

  const handleCatSelect = (docId: string | null) => {
    const params = new URLSearchParams();
    if (docId) {
      const cat = categorias.find((c) => c.documentId === docId);
      params.set("cat", cat?.slug || docId);
    }
    
    // Mantener la búsqueda actual si existe
    const currentQ = searchParams.get("q");
    if (currentQ) params.set("q", currentQ);

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
    setActiveDropdown(null);
    setIsOpen(false);
  };

  const isHome = pathname === "/";

  return (
    <nav className={cn(
      "fixed left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "bg-black/95 backdrop-blur-xl border-b border-white/10" : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Superior */}
        <div className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20">
          <Logo />
          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/portal" className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4" /> Portal
                </Link>
                <button onClick={() => signOut()} className="text-slate-500 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold text-slate-300 hover:text-white">Entrar</Link>
            )}
            <Link href="/contacto" className="bg-primary text-black px-6 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-all">Vende aquí</Link>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white"><Menu className="w-8 h-8" /></button>
        </div>

        {/* Barra de búsqueda y categorías (Yelp Style) */}
        <AnimatePresence>
          {(isHome || scrolled) && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="bg-black/20 backdrop-blur-md border-t border-white/5 pb-4"
            >
              <div className="px-4 py-4 flex flex-col gap-5">
                {/* Search Bar Split */}
                <div className="flex flex-col md:flex-row items-stretch bg-zinc-900 border border-white/10 rounded-lg overflow-hidden max-w-4xl w-full mx-auto shadow-2xl">
                  <div className="flex-1 flex items-center gap-3 px-5 py-3.5 border-b md:border-b-0 md:border-r border-white/10">
                    <Search className="w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="¿Qué buscas?" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                      className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0" 
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-3 px-5 py-3.5">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <input 
                      ref={locationInputRef} 
                      type="text" 
                      placeholder="Localidad" 
                      value={localidad} 
                      onChange={(e) => setLocalidad(e.target.value)} 
                      className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0" 
                    />
                  </div>
                  <button onClick={handleSearch} className="bg-[#9B1C1C] hover:bg-red-700 text-white px-10 py-4 md:py-0 font-black uppercase tracking-tighter transition-colors">
                    BUSCAR
                  </button>
                </div>

                {/* Categories Row */}
                <div ref={dropdownRef} className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 max-w-6xl mx-auto">
                  <button 
                    onClick={() => handleCatSelect(null)} 
                    className={cn(
                      "text-[13px] font-bold py-1.5 transition-all", 
                      !activeCatParam ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-white"
                    )}
                  >
                    Todas
                  </button>
                  
                  {mainCategorias.map((cat) => {
                    const subCats = getSubcategories(cat.documentId);
                    const isOpen = activeDropdown === cat.documentId;
                    const isActive = activeCatParam === cat.slug || activeCatParam === cat.documentId;

                    return (
                      <div key={cat.id} className="relative">
                        <button 
                          onClick={() => subCats.length ? setActiveDropdown(isOpen ? null : cat.documentId) : handleCatSelect(cat.documentId)} 
                          className={cn(
                            "flex items-center gap-1 text-[13px] font-bold py-1.5 transition-all", 
                            isActive ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-white"
                          )}
                        >
                          {cat.nombre} {subCats.length > 0 && <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />}
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 mt-2 min-w-[220px] bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-[200] p-2"
                            >
                              <button onClick={() => handleCatSelect(cat.documentId)} className="w-full text-left px-4 py-2.5 text-[13px] font-black text-primary hover:bg-white/5 rounded-lg mb-1">
                                Ver todo en {cat.nombre}
                              </button>
                              <div className="h-px bg-white/5 my-1" />
                              {subCats.map(sub => (
                                <button key={sub.id} onClick={() => handleCatSelect(sub.documentId)} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                  {sub.nombre}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} className="fixed inset-0 bg-black z-[200] flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              <Logo />
              <button onClick={() => setIsOpen(false)}><X className="w-10 h-10 text-white" /></button>
            </div>
            <div className="flex flex-col gap-8">
               <Link href="/contacto" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-primary">Vende aquí</Link>
               <Link href="/" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-white">Explorar</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 md:h-20 bg-black w-full fixed top-0 z-50 border-b border-white/5" />}>
      <NavbarInner />
    </Suspense>
  );
}
