"use client";

import { useState, useMemo } from "react";
import { Oferta } from "@/types/strapi";
import OfferCard from "@/components/business/OfferCard";
import NavigationFAB from "@/components/layout/NavigationFAB";
import { Tag, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OfferListClient({ initialOfertas }: { initialOfertas: Oferta[] }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Deduplicar por documentId: Strapi puede devolver draft+published del mismo documento
  const ofertas = useMemo(() => {
    const seen = new Set<string>();
    return initialOfertas.filter(o => {
      const key = o.documentId || String(o.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [initialOfertas]);

  // Extract unique categories from offers
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    ofertas.forEach(o => {
      if (o.negocio?.categoria) {
        cats.set(o.negocio.categoria.documentId, o.negocio.categoria.nombre);
      }
    });
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
  }, [ofertas]);

  const filteredOfertas = useMemo(() => {
    if (!selectedCategory) return ofertas;
    return ofertas.filter(o => o.negocio?.categoria?.documentId === selectedCategory);
  }, [ofertas, selectedCategory]);

  return (
    <main className="min-h-screen bg-background pb-20 pt-[calc(var(--navbar-height,80px)+20px)]">
      <NavigationFAB isVisible={true} type="back" onClick={() => router.back()} />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <header className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#FFBF00]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#FFBF00]/20 shadow-lg shadow-[#FFBF00]/5">
            <Tag className="w-8 h-8 text-[#FFBF00]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-3">Ofertas <span className="text-[#FFBF00]">Activas</span></h1>
          <p className="text-slate-400 max-w-lg mx-auto">Descubrí las mejores promociones y descuentos de los comercios de San Rafael esta semana.</p>
        </header>

        {/* Filters */}
        {categories.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-8 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === null
                  ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              Todas
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === c.id
                    ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filteredOfertas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOfertas.map((oferta, idx) => (
              <OfferCard key={oferta.id} oferta={oferta} index={idx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay ofertas activas</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              {selectedCategory 
                ? "No encontramos ofertas en esta categoría por el momento."
                : "Actualmente no hay ofertas destacadas esta semana. Vuelve a revisar pronto."}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-xl"
              >
                Ver todas las ofertas
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
