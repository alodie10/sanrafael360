"use client";

import { useEffect, useState } from "react";
import { CalendarHeart, X } from "lucide-react";
import Link from "next/link";
import { fetchFromStrapi } from "@/lib/strapi";

type PublicEfemeride = {
  documentId: string;
  nombre: string;
  slug: string;
};

export default function EfemeridesBanner() {
  const [items, setItems] = useState<PublicEfemeride[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("efemerides_banner_dismissed");
    if (dismissed) return;

    const load = async () => {
      try {
        const res = await fetchFromStrapi("efemerides/public");
        const data = (res.data || []) as PublicEfemeride[];
        if (data.length > 0) {
          setItems(data);
          setIsVisible(true);
        }
      } catch {
        // Silencioso: el módulo puede no estar migrado aún.
      }
    };
    load();
  }, []);

  if (!isVisible || items.length === 0) return null;

  return (
    <div className="w-full bg-primary/90 text-black px-4 py-2.5 flex items-center justify-center relative shadow-md z-40">
      <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-black uppercase tracking-wider w-full max-w-7xl mx-auto px-6 flex-wrap">
        <CalendarHeart className="w-4 h-4 shrink-0" />
        {items.map((item) => (
          <Link
            key={item.documentId}
            href={`/efemerides/${item.slug}`}
            className="hover:opacity-80 transition-opacity underline-offset-4 hover:underline"
          >
            {item.nombre}
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          sessionStorage.setItem("efemerides_banner_dismissed", "true");
        }}
        className="absolute right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
        aria-label="Cerrar banner de efemérides"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
