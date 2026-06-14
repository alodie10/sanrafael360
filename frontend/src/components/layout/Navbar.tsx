"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, LogOut, MapPin, ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/Logo";
import { useSession, signOut } from "next-auth/react";
import { Categoria } from "@/types/strapi";
import { fetchFromStrapi } from "@/lib/strapi";
import { Loader } from "@googlemaps/js-api-loader";

function NavbarInner() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  // Mobile hamburger menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Mobile: colapsa el search bar luego de buscar/seleccionar categoría
  const [mobileSearchCollapsed, setMobileSearchCollapsed] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [localidad, setLocalidad] = useState("San Rafael, Mendoza");

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<any>(null);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // --- Google Places Autocomplete (State Ref) ---
  const [locationInput, setLocationInput] = useState<HTMLInputElement | null>(null);

  // Visibilidad del search bar:
  const isHome = pathname === "/";
  const showSearchBarDesktop = !scrolled ? isHome : isHoveringNav;
  const showSearchBarMobile = isHome && !scrolled && !mobileSearchCollapsed;
  const showSearchBar = showSearchBarDesktop || showSearchBarMobile;

  useEffect(() => {
    if (!showSearchBar || !locationInput) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let isMounted = true;
    const loader = new Loader({ apiKey, version: "weekly", libraries: ["places", "marker", "maps"], language: "es" });
    
    loader.load().then((google) => {
      if (!isMounted || !locationInput.isConnected) return;
      if (!(locationInput instanceof HTMLInputElement)) return;
      
      try {
        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(-36.2, -70.3),
          new google.maps.LatLng(-33.8, -67.2)
        );
        
        const autocomplete = new google.maps.places.Autocomplete(locationInput, {
          componentRestrictions: { country: "ar" },
          types: [],
          fields: ["formatted_address", "geometry"],
          bounds,
          strictBounds: true,
        });
        
        autocompleteRef.current = autocomplete;
        
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            let clean = place.formatted_address.split(",")[0]
              .replace(/M560\d/g, "").replace(/RN\d+/g, "").replace(/RP\d+/g, "").trim();
            setLocalidad(clean || place.formatted_address.split(",")[0]);
          }
        });
      } catch (err) {
        console.error("Google Autocomplete initialization error:", err);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      autocompleteRef.current = null;
    };
  }, [showSearchBar, locationInput]);

  // --- Cargar categorías ---
  useEffect(() => {
    fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc&pagination[pageSize]=100")
      .then((res) => setCategorias(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setLocalidad(searchParams.get("l") || "San Rafael, Mendoza");
    setMobileSearchCollapsed(!!(searchParams.get("q") || searchParams.get("cat")));
  }, []);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSearchQuery(customEvent.detail.q || "");
        setLocalidad(customEvent.detail.l || "San Rafael, Mendoza");
        setMobileSearchCollapsed(!!(customEvent.detail.q || customEvent.detail.cat));
      }
    };
    window.addEventListener("query-params-changed", handleSync);
    return () => window.removeEventListener("query-params-changed", handleSync);
  }, []);

  // --- Scroll listener + publicar altura del Navbar como CSS var ---
  const publishNavHeight = useCallback(() => {
    const h = navRef.current?.getBoundingClientRect().height ?? 0;
    document.documentElement.style.setProperty("--navbar-height", `${Math.round(h)}px`);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      requestAnimationFrame(publishNavHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [publishNavHeight]);

  useEffect(() => {
    publishNavHeight();
    const ro = new ResizeObserver(publishNavHeight);
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [publishNavHeight, scrolled, isHoveringNav, mobileSearchCollapsed, isMenuOpen]);

  // --- Resetear al cambiar de página ---
  useEffect(() => {
    setScrolled(false);
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoveringNav(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setIsHoveringNav(false), 150);
  };

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
    setIsMenuOpen(false);

    // Sincronizar inmediatamente el estado
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("query-params-changed", {
        detail: { q: searchQuery.trim(), l: localidad.trim(), cat: "" }
      }));
    }
  };

  const handleResetAll = () => {
    setSearchQuery("");
    setLocalidad("San Rafael, Mendoza");
    router.push("/");
    setIsMenuOpen(false);
    setMobileSearchCollapsed(false);
    window.scrollTo(0, 0);

    // Sincronizar inmediatamente el estado
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("query-params-changed", {
        detail: { q: "", l: "San Rafael, Mendoza", cat: "" }
      }));
    }
  };

  // Ya calculados arriba para el Autocomplete

  return (
    <nav
      ref={navRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "left-0 right-0 z-[100] transition-all duration-300 top-[calc(var(--app-banner-height,0px)+var(--master-bar-height,0px))]",
        scrolled
          ? "fixed bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          : "relative md:fixed bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col">

        {/* ─── HEADER ROW ─── */}
        <div className="relative z-10 flex items-center justify-between px-4 md:px-8 h-14 md:h-20 bg-black/90 md:bg-transparent">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Logo onClick={handleResetAll} className="hover:scale-105 transition-transform" />
            <span className="text-[10px] text-white/20 font-mono mt-3 hidden md:block">
              {process.env.NEXT_PUBLIC_APP_VERSION || "v1.1"}
            </span>
          </div>

          {/* ── Desktop center: search hint cuando está scrolleado ── */}
          <AnimatePresence>
            {scrolled && !isHoveringNav && (
              <motion.button
                key="search-hint"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsHoveringNav(true)}
                className="hidden md:flex items-center gap-2 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-slate-400 hover:text-white text-sm transition-all group"
                aria-label="Abrir buscador"
              >
                <Search className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">
                  {searchQuery ? `"${searchQuery}"` : "¿Qué buscás?"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-6">
            {!session ? (
              <Link href="/login" className="text-white/70 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Ingresar
              </Link>
            ) : (
              <button onClick={() => signOut()} className="text-white/70 hover:text-white text-sm font-bold transition-colors flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-500" />
                Salir
              </button>
            )}
            {pathname !== "/contacto" && (
              <Link href="/contacto" className="bg-primary text-black px-6 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)]">
                Vende aquí
              </Link>
            )}
          </div>

          {/* ── Mobile right actions: lupa (si colapsado) + hamburger ── */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Lupa para re-expandir el search — aparece cuando el search está colapsado o se hizo scroll */}
            <AnimatePresence>
              {(mobileSearchCollapsed || scrolled) && isHome && (
                <motion.button
                  key="mobile-search-expand"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleResetAll}
                  className="p-2 rounded-full text-primary hover:bg-white/10 transition-all"
                  aria-label="Limpiar búsqueda y abrir buscador"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Hamburger */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-all"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ─── MOBILE DROPDOWN MENU ─── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden bg-zinc-950 border-t border-white/[0.06]"
            >
              <div className="px-6 py-4 space-y-1">
                {!session ? (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 text-white/70 hover:text-white py-3 border-b border-white/[0.06] text-sm font-bold transition-colors"
                  >
                    <User className="w-4 h-4 text-primary" />
                    Iniciar sesión
                  </Link>
                ) : (
                  <button
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 text-white/70 hover:text-white py-3 border-b border-white/[0.06] text-sm font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Cerrar sesión
                  </button>
                )}
                {pathname !== "/contacto" && (
                  <Link
                    href="/contacto"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 text-white/70 hover:text-white py-3 text-sm font-bold transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    Vende aquí / Contáctanos
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BARRA DE BÚSQUEDA ───
            Desktop: visible en home (no scroll) o al hacer hover (scroll)
            Mobile: visible en home, no scroll, y no colapsada
            El `hidden md:block` / `block md:hidden` separa el comportamiento por viewport */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              key="searchbar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "overflow-hidden",
                // En mobile solo mostramos si no está colapsado
                !showSearchBarMobile && showSearchBarDesktop ? "hidden md:block" : "block"
              )}
            >
              <div className="bg-black/40 backdrop-blur-md border-t border-white/5 pb-4">
                <div className="px-4 pt-4 flex flex-col max-w-4xl mx-auto w-full">
                  <div className="flex flex-col md:flex-row items-stretch bg-zinc-900/90 border border-white/10 rounded-xl overflow-hidden w-full shadow-2xl">
                    {/* Qué buscas */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-white/10 relative group">
                      <Search className="w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="¿Qué buscas?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={(e) => { e.target.select(); setLocalidad("San Rafael, Mendoza"); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0 font-medium pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            const params = new URLSearchParams(window.location.search);
                            if (params.has("q")) {
                              params.delete("q");
                              const qs = params.toString();
                              router.push(qs ? `/?${qs}` : "/", { scroll: false });
                            }
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(new CustomEvent("query-params-changed", {
                                detail: { q: "", l: localidad, cat: params.get("cat") || "" }
                              }));
                            }
                          }}
                          className="absolute right-3 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {/* Dónde */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-4 relative group">
                      <MapPin className="w-5 h-5 text-slate-500" />
                      <input
                        ref={setLocationInput}
                        type="text"
                        placeholder="Localidad"
                        value={localidad}
                        onChange={(e) => setLocalidad(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="bg-transparent border-none outline-none w-full text-white text-base focus:ring-0 font-medium pr-8"
                      />
                      {localidad !== "San Rafael, Mendoza" && (
                        <button onClick={() => setLocalidad("San Rafael, Mendoza")} className="absolute right-3 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={handleSearch} className="bg-white hover:bg-zinc-200 text-black px-10 py-4 md:py-0 font-heading font-black uppercase tracking-widest transition-all active:scale-95">
                      BUSCAR
                    </button>
                  </div>
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
  return (
    <Suspense fallback={<div className="h-14 md:h-20 bg-black w-full fixed top-0 z-50 border-b border-white/5 shadow-2xl" />}>
      <NavbarInner />
    </Suspense>
  );
}
