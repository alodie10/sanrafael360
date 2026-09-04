"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import OffersBanner from "@/components/home/OffersBanner";
import EfemeridesBanner from "@/components/home/EfemeridesBanner";
import NavigationFAB from "@/components/layout/NavigationFAB";
import { AnimatePresence } from "framer-motion";
import { Negocio, Categoria } from "@/types/strapi";
import { shouldUseStrapiSearchForHome, canUseAlgoliaSearch } from "@/lib/search-config";
import {
  searchNegociosFromStrapi,
  searchNegociosFromAlgolia,
} from "@/lib/search-negocios";
import { isStrapiUnreachableError } from "@/lib/strapi";
import { useRouter, usePathname } from "next/navigation";
import { buildSearchExplanation, matchRank } from "@/lib/search-match";

const normalizeText = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const isPremiumActive = (negocio: Negocio): boolean => {
  if (!negocio.is_premium) return false;
  if (!negocio.premium_valid_until) return true;
  return new Date(negocio.premium_valid_until) > new Date();
};

function resolveCategoryFromParam(
  catParam: string | null,
  categorias: Categoria[]
): string | null {
  if (!catParam) return null;
  const found = categorias.find(
    (c) =>
      c.documentId === catParam ||
      c.slug === catParam ||
      normalizeText(c.nombre) === normalizeText(catParam)
  );
  return found ? found.documentId : null;
}

interface HomeClientProps {
  categorias: Categoria[];
  initialNegocios: Negocio[];
}

export default function HomeClient({ categorias, initialNegocios }: HomeClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const prevFiltersKey = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [localidadQuery, setLocalidadQuery] = useState(() => searchParams.get("l") || "");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(() =>
    resolveCategoryFromParam(
      searchParams.get("cat") || searchParams.get("categoria"),
      categorias
    )
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<Negocio[]>(initialNegocios);
  const [isSearching, setIsSearching] = useState(false);

  const filtersKey = `${searchQuery}|${localidadQuery}|${selectedCategoryDocId ?? ""}`;

  useEffect(() => {
    setSearchResults(initialNegocios);
    setIsSearching(false);
    prevFiltersKey.current = filtersKey;
  }, [initialNegocios]); // eslint-disable-line react-hooks/exhaustive-deps -- sync SSR payload; filtersKey pinned on that tick


  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryDocId(id);
    setSearchQuery("");
    setLocalidadQuery("");

    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      const cat = categorias.find((c) => c.documentId === id);
      if (cat) params.set("cat", cat.slug || cat.documentId);
      params.delete("q");
      params.delete("l");
    } else {
      params.delete("cat");
      params.delete("q");
      params.delete("l");
      scrollToResults();
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("query-params-changed", {
          detail: {
            q: "",
            l: "",
            cat: params.get("cat") || "",
          },
        })
      );
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncFromUrl = (e?: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent?.detail) {
        const qVal = customEvent.detail.q || "";
        const lVal = customEvent.detail.l || "";
        const catVal = customEvent.detail.cat || "";

        setSearchQuery(qVal);
        setLocalidadQuery(lVal);
        setSelectedCategoryDocId(resolveCategoryFromParam(catVal || null, categorias));
        return;
      }

      const paramsString =
        e && e.type === "popstate" ? window.location.search : searchParams.toString();
      const params = new URLSearchParams(paramsString);
      setSearchQuery(params.get("q") || "");
      setLocalidadQuery(params.get("l") || "");
      setSelectedCategoryDocId(
        resolveCategoryFromParam(params.get("cat") || params.get("categoria"), categorias)
      );
    };

    syncFromUrl();

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("query-params-changed", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("query-params-changed", syncFromUrl);
    };
  }, [categorias, searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("query-params-changed", {
          detail: {
            q: searchParams.get("q") || "",
            l: searchParams.get("l") || "",
            cat: searchParams.get("cat") || searchParams.get("categoria") || "",
          },
        })
      );
    }
  }, [searchParams]);

  useEffect(() => {
    const q = searchParams.get("q");
    const l = searchParams.get("l");
    if (q || l) {
      const timer = setTimeout(scrollToResults, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (prevFiltersKey.current === null) {
      prevFiltersKey.current = filtersKey;
      return;
    }
    if (prevFiltersKey.current === filtersKey) {
      return;
    }
    prevFiltersKey.current = filtersKey;

    const performSearch = async () => {
      setIsSearching(true);
      const params = {
        query: searchQuery,
        localidad: localidadQuery,
        categoryDocId: selectedCategoryDocId,
        categorias,
      };

      try {
        if (shouldUseStrapiSearchForHome()) {
          try {
            const negocios = await searchNegociosFromStrapi(params);
            setSearchResults(negocios);
            return;
          } catch (error) {
            if (!isStrapiUnreachableError(error) || !canUseAlgoliaSearch()) {
              setSearchResults([]);
              return;
            }
          }
        }

        if (canUseAlgoliaSearch()) {
          const negocios = await searchNegociosFromAlgolia(params);
          setSearchResults(negocios);
          return;
        }

        setSearchResults([]);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Search unavailable:", e);
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [filtersKey, searchQuery, localidadQuery, selectedCategoryDocId, categorias]);

  const scrollToResults = () => {
    const results = resultsRef.current;
    const filterBar = filterBarRef.current;
    if (!results) return;

    const stickyTop = filterBar
      ? parseFloat(getComputedStyle(filterBar).top) || 0
      : 0;
    const offset = stickyTop + (filterBar?.offsetHeight ?? 0) + 16;
    const top = window.scrollY + results.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterBarRef = useRef<HTMLDivElement>(null);

  const sortedNegocios = useMemo(() => {
    const hasTextQuery = searchQuery.trim().length > 0;
    return [...searchResults].sort((a, b) => {
      if (hasTextQuery) {
        const matchDelta = matchRank(a.searchMatch) - matchRank(b.searchMatch);
        if (matchDelta !== 0) return matchDelta;
      }

      const isAPremium = isPremiumActive(a);
      const isBPremium = isPremiumActive(b);

      if (isAPremium && !isBPremium) return -1;
      if (!isAPremium && isBPremium) return 1;

      if (userLocation && a.latitud && a.longitud && b.latitud && b.longitud) {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.latitud, a.longitud);
        const distB = getDistance(userLocation.lat, userLocation.lng, b.latitud, b.longitud);
        return distA - distB;
      }

      return a.nombre.localeCompare(b.nombre);
    });
  }, [searchResults, userLocation, searchQuery]);

  const searchExplanation = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return buildSearchExplanation(
      searchResults.length,
      q,
      searchResults.map((n) => n.searchMatch)
    );
  }, [searchQuery, searchResults]);

  const isFiltering =
    searchQuery.trim().length > 0 ||
    selectedCategoryDocId !== null ||
    (localidadQuery !== "" && localidadQuery !== "San Rafael, Mendoza");

  return (
    <main ref={topRef} className="min-h-screen pb-4 md:pb-8">
      <section className="relative h-[25vh] md:h-[35vh] flex flex-col items-center justify-center text-center px-4">
        <HeroCarousel />
      </section>

      <div id="filter-bar" ref={filterBarRef} className="sticky-filter-bar scroll-mt-36">
        <FilterBar categorias={categorias} selectedCategoryDocId={selectedCategoryDocId} />
        <EfemeridesBanner />
        <OffersBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 bg-background">
        <AnimatePresence mode="wait" />

        <section className="mt-4" ref={resultsRef}>
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  Comercios{" "}
                  <span className="text-primary italic">
                    {isFiltering ? "Encontrados" : "Destacados"}
                  </span>
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-white/[0.04] border border-white/[0.08] rounded-full px-2.5 py-0.5">
                  {sortedNegocios.length}
                </span>
              </div>
              {isFiltering && !searchExplanation && (
                <p className="text-xs text-slate-500 hidden md:block">
                  {selectedCategoryDocId
                    ? `En ${categorias.find((c) => c.documentId === selectedCategoryDocId)?.nombre}`
                    : "San Rafael, Mendoza"}
                </p>
              )}
            </div>
            {searchExplanation && (
              <p
                data-testid="search-explanation"
                className="mt-2 text-sm text-slate-400"
              >
                {searchExplanation}
              </p>
            )}
          </div>
          <BusinessGrid
            negocios={sortedNegocios}
            loading={isSearching}
            emptyMessage={
              searchQuery
                ? "No encontramos negocios exactos, probá buscar con otras palabras o sinónimos."
                : "No hay negocios en esta categoría."
            }
            onClearFilters={() => handleSelectCategory(null)}
          />
        </section>
      </div>

      <NavigationFAB
        isVisible={showScrollTop}
        type={isFiltering ? "reset" : "top"}
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
