"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Search, User, LogOut, MapPin, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/Logo";
import { useSession, signOut } from "next-auth/react";
import { Categoria } from "@/types/strapi";
import { getCategoryIcon } from "@/lib/icons";
import { fetchFromStrapi } from "@/lib/strapi";

// ─── Localidades de San Rafael ────────────────────────────────────────────────
const localidades = [
  "San Rafael",
  "Villa 25 de Mayo",
  "General Alvear",
  "Monte Comán",
  "Rama Caída",
  "El Sosneado",
];

// Cuántas categorías se muestran inline antes de "Más ▾"
const VISIBLE_CAT_LIMIT = 6;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [localidad, setLocalidad] = useState("San Rafael");
  const [showLocalidades, setShowLocalidades] = useState(false);
  const [showMas, setShowMas] = useState(false);

  const localidadRef = useRef<HTMLDivElement>(null);
  const masRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session as any)?.user?.role;
  const hasMasterBar =
    !!session &&
    (userRole === "Admin" || userRole === "Propietario" || userRole === "Authenticated");

  // Categoría activa desde la URL
  const activeCatParam = searchParams.get("cat");
  const selectedCategoryDocId = activeCatParam;

  // ─── Cargar categorías principales ─────────────────────────────────────────
  useEffect(() => {
    fetchFromStrapi("categorias?fields[0]=nombre&fields[1]=slug&populate[parent][fields][0]=documentId&sort=nombre:asc")
      .then((res) => setCategorias(res.data || []))
      .catch(() => {/* silencioso */});
  }, []);

  // ─── Sincronizar query desde URL ────────────────────────────────────────────
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  // ─── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Cerrar dropdowns al clic fuera ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (localidadRef.current && !localidadRef.current.contains(e.target as Node)) {
        setShowLocalidades(false);
      }
      if (masRef.current && !masRef.current.contains(e.target as Node)) {
        setShowMas(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Solo categorías principales ────────────────────────────────────────────
  const mainCategorias = categorias.filter((c) => !c.parent);
  const visibleCats = mainCategorias.slice(0, VISIBLE_CAT_LIMIT);
  const overflowCats = mainCategorias.slice(VISIBLE_CAT_LIMIT);
  const hasOverflow = overflowCats.length > 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
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
    setShowMas(false);
    setIsOpen(false);
  };

  // ─── ¿Estamos en la home? (barra de búsqueda solo allí) ────────────────────
  const isHome = pathname === "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-500",
        hasMasterBar ? "top-10" : "top-0",
        scrolled
          ? "bg-black/98 backdrop-blur-2xl border-b border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
          : "bg-black/80 backdrop-blur-xl border-b border-white/5"
      )}
    >
      {/* ════════════════════════════════════════════════════
          FILA 1: Logo + Acciones de usuario
      ════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
        {/* Logo */}
        <Logo />

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-5">
          {session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/portal"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-all text-sm font-semibold group"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Portal
              </Link>
              <button
                onClick={() => signOut()}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href={`/login?callbackUrl=${pathname}`}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
          )}

          <Link
            href="/contacto"
            className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-full font-bold text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(255,191,0,0.25)] hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Vende aquí
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          {session ? (
            <Link href="/portal" className="text-primary">
              <User className="w-6 h-6" />
            </Link>
          ) : (
            <Link
              href={`/login?callbackUrl=${pathname}`}
              className="text-slate-300 text-xs font-bold uppercase tracking-wider"
            >
              Entrar
            </Link>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          FILA 2: Split Search Bar + Nav Categorías (solo home)
      ════════════════════════════════════════════════════ */}
      {isHome && (
        <div className="border-t border-white/[0.04] px-4 md:px-8 pb-3 pt-2">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">

            {/* ── Split Search Bar ── */}
            <div
              id="navbar-split-search"
              className="flex items-stretch rounded-xl overflow-hidden border border-gray-800 bg-white/[0.06] backdrop-blur-xl max-w-3xl w-full mx-auto shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            >
              {/* Campo izquierdo */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0">
                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="text"
                  id="navbar-search-input"
                  placeholder="¿Qué buscas en San Rafael?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-gray-600 text-sm focus:ring-0 truncate"
                />
              </div>

              {/* Divisor */}
              <div className="w-px bg-gray-800 my-2 shrink-0" />

              {/* Campo derecho: Localidad */}
              <div ref={localidadRef} className="relative shrink-0">
                <button
                  id="navbar-localidad-btn"
                  onClick={() => setShowLocalidades(!showLocalidades)}
                  className="flex items-center gap-2 px-4 py-2.5 h-full text-gray-500 hover:text-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{localidad}</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200 shrink-0",
                      showLocalidades && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {showLocalidades && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute top-full right-0 mt-2 min-w-[190px] bg-[#0a0a0a]/98 backdrop-blur-2xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {localidades.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => { setLocalidad(loc); setShowLocalidades(false); }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors",
                            localidad === loc
                              ? "text-white bg-white/10 font-semibold"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {loc}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botón Buscar — Carmesí oscuro */}
              <button
                id="navbar-search-btn"
                onClick={handleSearch}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#9B1C1C] hover:bg-[#7F1D1D] active:bg-[#6B1A1A] text-white font-bold text-sm transition-colors shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            {/* ── Nav de Categorías ── */}
            {mainCategorias.length > 0 && (
              <div
                id="navbar-categories"
                className="flex items-center flex-nowrap overflow-hidden gap-0.5 max-w-3xl mx-auto w-full"
              >
                {/* "Todas" */}
                <button
                  id="navbar-cat-all"
                  onClick={() => handleCatSelect(null)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                    !activeCatParam
                      ? "text-black bg-white"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <LayoutGrid className="w-3 h-3 shrink-0" />
                  <span>Todas</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                </button>

                {/* Categorías visibles */}
                {visibleCats.map((cat) => {
                  const Icon = getCategoryIcon(cat.nombre);
                  const isActive = selectedCategoryDocId === cat.documentId || selectedCategoryDocId === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      id={`navbar-cat-${cat.documentId}`}
                      onClick={() => handleCatSelect(cat.documentId)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                        isActive
                          ? "text-black bg-primary"
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{cat.nombre}</span>
                      <ChevronDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                    </button>
                  );
                })}

                {/* Botón "Más ▾" */}
                {hasOverflow && (
                  <div ref={masRef} className="relative shrink-0">
                    <button
                      id="navbar-mas-btn"
                      onClick={() => setShowMas(!showMas)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap",
                        showMas
                          ? "text-white bg-white/10"
                          : "text-gray-500 hover:text-gray-200"
                      )}
                    >
                      <span>Más</span>
                      <ChevronDown
                        className={cn(
                          "w-2.5 h-2.5 transition-transform duration-200",
                          showMas && "rotate-180"
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {showMas && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          className="absolute top-full left-0 mt-2 min-w-[210px] bg-[#0a0a0a]/98 backdrop-blur-2xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          {overflowCats.map((cat) => {
                            const Icon = getCategoryIcon(cat.nombre);
                            const isActive =
                              selectedCategoryDocId === cat.documentId ||
                              selectedCategoryDocId === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => handleCatSelect(cat.documentId)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                                  isActive
                                    ? "text-primary bg-primary/10 font-semibold"
                                    : "text-gray-300 hover:text-white hover:bg-white/5"
                                )}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                {cat.nombre}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MOBILE MENU
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black/98 backdrop-blur-2xl border-b border-white/5 p-6 md:hidden flex flex-col gap-5 shadow-2xl"
          >
            {/* Mobile Search */}
            <div className="flex items-stretch rounded-xl overflow-hidden border border-gray-800 bg-white/[0.06]">
              <div className="flex-1 flex items-center gap-2 px-4 py-3">
                <Search className="w-4 h-4 text-gray-600 shrink-0" />
                <input
                  type="text"
                  placeholder="¿Qué buscas?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-gray-600 text-sm focus:ring-0"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-[#9B1C1C] text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Categories */}
            {mainCategorias.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleCatSelect(null)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                    !activeCatParam ? "bg-white text-black" : "bg-white/10 text-gray-300"
                  )}
                >
                  <LayoutGrid className="w-3 h-3" />
                  Todas
                </button>
                {mainCategorias.map((cat) => {
                  const Icon = getCategoryIcon(cat.nombre);
                  const isActive =
                    selectedCategoryDocId === cat.documentId ||
                    selectedCategoryDocId === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCatSelect(cat.documentId)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                        isActive ? "bg-primary text-black" : "bg-white/10 text-gray-300"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="h-px bg-white/5" />

            {session ? (
              <>
                <Link
                  href="/portal"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-primary"
                >
                  <User className="w-5 h-5" />
                  Mi Portal
                </Link>
                <button
                  onClick={() => { setIsOpen(false); signOut(); }}
                  className="flex items-center gap-3 text-lg font-bold text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-lg font-bold text-white"
              >
                <User className="w-5 h-5" />
                Iniciar Sesión
              </Link>
            )}

            <Link
              href="/contacto"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-black py-4 rounded-2xl text-center font-bold text-lg"
            >
              Vende con nosotros
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
