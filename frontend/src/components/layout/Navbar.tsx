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
  const userRole = (session as any)?.user?.role;
  const hasMasterBar =
    !!session &&
    (userRole === "Admin" || userRole === "Propietario" || userRole === "Authenticated");

  const activeCatParam = searchParams.get("cat");

  // ─── Google Places Autocomplete ─────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !locationInputRef.current) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
      language: "es",
    });

    loader.load().then((google) => {
      const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current!, {
        componentRestrictions: { country: "ar" },
        types: ["(cities)"],
        fields: ["formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setLocalidad(place.formatted_address);
        }
      });
      setIsPlacesLoaded(true);
    }).catch(e => console.error("Places load error", e));
  }, []);

  // ─── Cargar categorías ──────────────────────────────────────────────────────
  useEffect(() => {
    // Traemos todas las categorías para construir la jerarquía localmente
    fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100")
      .then((res) => setCategorias(res.data || []))
      .catch(() => {});
  }, []);

  // ─── Sincronizar query desde URL ────────────────────────────────────────────
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // ─── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Cerrar dropdowns ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Jerarquía de Categorías ────────────────────────────────────────────────
  const mainCategorias = categorias.filter((c) => !c.parent);
  const getSubcategories = (parentId: string) => categorias.filter(c => c.parent?.documentId === parentId);

  const handleSearch = () => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    else params.delete("q");
    
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setIsOpen(false);
  };

  const handleCatSelect = (docId: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (docId) {
      const cat = categorias.find((c) => c.documentId === docId);
      params.set("cat", cat?.slug || docId);
    } else {
      params.delete("cat");
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
    setActiveDropdown(null);
    setIsOpen(false);
  };

  const isHome = pathname === "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-500",
        hasMasterBar ? "top-10" : "top-0",
        scrolled
          ? "bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Header Superior */}
        <div className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20">
          <Logo />

          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/portal" className="text-slate-300 hover:text-white transition-all text-sm font-bold flex items-center gap-2 group">
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Portal
                </Link>
                <button onClick={() => signOut()} className="text-slate-500 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href={`/login?callbackUrl=${pathname}`} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">
                Entrar
              </Link>
            )}

            <Link
              href="/contacto"
              className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Vende aquí
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>

        {/* 2. Barra de Búsqueda Split y Categorías (Yelp Style) */}
        <AnimatePresence>
          {(isHome || scrolled) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-black/20 backdrop-blur-md border-t border-white/5"
            >
              <div className="px-4 py-4 flex flex-col gap-5">
                
                {/* Search Bar Group */}
                <div className="flex flex-col md:flex-row items-stretch bg-zinc-900/90 border border-white/10 rounded-xl md:rounded-lg overflow-hidden shadow-2xl max-w-4xl w-full mx-auto">
                  {/* Query Field */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-3.5 border-b md:border-b-0 md:border-r border-white/10">
                    <Search className="w-5 h-5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="¿Qué buscas en San Rafael?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-sm md:text-base font-medium focus:ring-0"
                    />
                  </div>
                  
                  {/* Location Field with Autocomplete */}
                  <div className="flex-1 flex items-center gap-3 px-5 py-3.5 min-w-0">
                    <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                    <input
                      ref={locationInputRef}
                      type="text"
                      placeholder="Localidad"
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 text-sm md:text-base font-medium focus:ring-0 truncate"
                    />
                    {!isPlacesLoaded && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                  </div>

                  {/* Search Button (Crimson Red) */}
                  <button
                    onClick={handleSearch}
                    className="bg-[#9B1C1C] hover:bg-[#B91C1C] text-white px-10 py-4 md:py-0 font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5 stroke-[3]" />
                    <span>Buscar</span>
                  </button>
                </div>

                {/* Categories Row (Yelp Style Subcategories Dropdown) */}
                <div ref={dropdownRef} className="flex items-center justify-center flex-wrap gap-x-2 gap-y-2 md:gap-x-6 max-w-6xl mx-auto">
                  <button
                    onClick={() => handleCatSelect(null)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all",
                      !activeCatParam ? "text-white border-b-2 border-primary" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Todas
                  </button>

                  {mainCategorias.map((cat) => {
                    const Icon = getCategoryIcon(cat.nombre);
                    const subCats = getSubcategories(cat.documentId);
                    const hasSubs = subCats.length > 0;
                    const isActive = activeCatParam === cat.documentId || activeCatParam === cat.slug;
                    const isOpen = activeDropdown === cat.documentId;

                    return (
                      <div key={cat.id} className="relative group/cat">
                        <button
                          onClick={() => {
                            if (hasSubs) setActiveDropdown(isOpen ? null : cat.documentId);
                            else handleCatSelect(cat.documentId);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-1 py-1.5 text-[13px] font-bold transition-all whitespace-nowrap",
                            isActive ? "text-white border-b-2 border-primary" : "text-slate-400 hover:text-white"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {cat.nombre}
                          {hasSubs && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />}
                        </button>

                        {/* Subcategories Dropdown */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 mt-2 min-w-[220px] bg-zinc-950/98 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                            >
                              <div className="p-2 flex flex-col">
                                <button
                                  onClick={() => handleCatSelect(cat.documentId)}
                                  className="w-full text-left px-4 py-2.5 text-[13px] font-black text-primary hover:bg-white/5 rounded-lg transition-colors mb-1"
                                >
                                  Ver todo en {cat.nombre}
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                {subCats.map(sub => (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleCatSelect(sub.documentId)}
                                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                  >
                                    {sub.nombre}
                                  </button>
                                ))}
                              </div>
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

      {/* Mobile Menu Fullscreen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 bg-black z-[200] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <Logo />
              <button onClick={() => setIsOpen(false)}><X className="w-10 h-10 text-white" /></button>
            </div>
            
            <div className="flex flex-col gap-8">
               <div className="flex flex-col gap-4">
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Portal</p>
                  {session ? (
                    <>
                      <Link href="/portal" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-white hover:text-primary transition-colors">Mi Panel</Link>
                      <button onClick={() => { signOut(); setIsOpen(false); }} className="text-3xl font-black italic text-red-500 text-left">Cerrar Sesión</button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-white hover:text-primary transition-colors">Iniciar Sesión</Link>
                  )}
               </div>

               <div className="flex flex-col gap-4">
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Navegación</p>
                  <Link href="/contacto" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-primary hover:text-white transition-colors">Vende con nosotros</Link>
                  <Link href="/" onClick={() => setIsOpen(false)} className="text-3xl font-black italic text-white hover:text-primary transition-colors">Explorar</Link>
               </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10">
              <p className="text-slate-600 text-xs uppercase tracking-[0.3em] font-bold">San Rafael 360 • Mendoza</p>
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
