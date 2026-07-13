"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import HeroCarousel from "@/components/home/HeroCarousel";
import BusinessGrid from "@/components/home/BusinessGrid";
import FilterBar from "@/components/home/FilterBar";
import OffersBanner from "@/components/home/OffersBanner";
import NavigationFAB from "@/components/layout/NavigationFAB";
import { AnimatePresence } from "framer-motion";
import { Negocio, Categoria } from "@/types/strapi";
import { shouldUseStrapiSearchForHome } from "@/lib/search-config";
import { searchNegociosFromStrapi } from "@/lib/search-negocios";
import { useRouter, usePathname } from "next/navigation";

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

interface HomeClientProps {
  categorias: Categoria[];
}

export default function HomeClient({ categorias }: HomeClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [localidadQuery, setLocalidadQuery] = useState("");
  const [selectedCategoryDocId, setSelectedCategoryDocId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<Negocio[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

        if (catVal) {
          const found = categorias.find(
            (c) => c.documentId === catVal || c.slug === catVal
          );
          setSelectedCategoryDocId(found ? found.documentId : null);
        } else {
          setSelectedCategoryDocId(null);
        }
        return;
      }

      const paramsString =
        e && e.type === "popstate" ? window.location.search : searchParams.toString();
      const params = new URLSearchParams(paramsString);
      setSearchQuery(params.get("q") || "");
      setLocalidadQuery(params.get("l") || "");

      const catParam = params.get("cat") || params.get("categoria");
      if (catParam) {
        const found = categorias.find(
          (c) =>
            c.documentId === catParam ||
            c.slug === catParam ||
            normalizeText(c.nombre) === normalizeText(catParam)
        );
        setSelectedCategoryDocId(found ? found.documentId : null);
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
    const performSearch = async () => {
      setIsSearching(true);
      try {
        if (shouldUseStrapiSearchForHome()) {
          const negocios = await searchNegociosFromStrapi({
            query: searchQuery,
            localidad: localidadQuery,
            categoryDocId: selectedCategoryDocId,
          });
          setSearchResults(negocios);
          return;
        }

        const { algoliasearch } = await import("algoliasearch");
        const client = algoliasearch(
          process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
          process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
        );

        let fullQuery = `${searchQuery} ${localidadQuery}`.trim();

        if (selectedCategoryDocId) {
          const selectedCat = categorias.find((c) => c.documentId === selectedCategoryDocId);
          if (selectedCat) {
            fullQuery = `${fullQuery} ${selectedCat.nombre}`.trim();
          }
        }

        const { results } = await client.search({
          requests: [
            {
              indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "negocios",
              query: fullQuery,
              hitsPerPage: 100,
            },
          ],
        });

        const hits = (results[0] as { hits?: Record<string, unknown>[] })?.hits || [];
        const sortedHits = hits.sort((a, b) => {
          if (a.is_premium && !b.is_premium) return -1;
          if (!a.is_premium && b.is_premium) return 1;
          return 0;
        });

        setSearchResults(
          sortedHits.map((hit) => ({
            documentId: hit.objectID as string,
            slug: hit.slug as string,
            nombre: hit.nombre as string,
            direccion: hit.direccion as string,
            is_premium: hit.is_premium as boolean,
            premium_valid_until: hit.premium_valid_until as string,
            categoria: hit.categoria
              ? ({ nombre: hit.categoria as string } as Categoria)
              : undefined,
            atributos: (hit.atributos_ui as Negocio["atributos"]) || [],
            price_range: hit.price_range as string,
            rating: hit.rating as number,
            review_count: hit.review_count as number,
            google_rating: hit.google_rating as number,
            google_review_count: hit.google_review_count as number,
            tripadvisor_rating: hit.tripadvisor_rating as number,
            tripadvisor_review_count: hit.tripadvisor_review_count as number,
            imagen_portada: hit.imagen_portada as Negocio["imagen_portada"],
            logo: hit.logo as Negocio["logo"],
            owner: hit.owner as Negocio["owner"],
            latitud: hit.latitud as number,
            longitud: hit.longitud as number,
            ofertas: (hit.ofertas as Negocio["ofertas"]) || [],
          })) as Negocio[]
        );
      } catch (e) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, localidadQuery, selectedCategoryDocId, categorias]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    return [...searchResults].sort((a, b) => {
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
  }, [searchResults, userLocation]);

  const isFiltering =
    searchQuery.trim().length > 0 ||
    selectedCategoryDocId !== null ||
    (localidadQuery !== "" && localidadQuery !== "San Rafael, Mendoza");

  return (
    <main ref={topRef} className="min-h-screen">
      <section className="relative h-[25vh] md:h-[35vh] flex flex-col items-center justify-center text-center px-4">
        <HeroCarousel />
      </section>

      <div id="filter-bar" ref={filterBarRef} className="sticky-filter-bar scroll-mt-36">
        <FilterBar categorias={categorias} selectedCategoryDocId={selectedCategoryDocId} />
        <OffersBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 bg-background">
        <AnimatePresence mode="wait" />

        <section className="mt-4 scroll-mt-64" ref={resultsRef}>
          <div className="flex items-center justify-between mb-6 gap-4">
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
            {isFiltering && (
              <p className="text-xs text-slate-500 hidden md:block">
                {selectedCategoryDocId
                  ? `En ${categorias.find((c) => c.documentId === selectedCategoryDocId)?.nombre}`
                  : "San Rafael, Mendoza"}
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
