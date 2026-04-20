"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  initialValue?: string;
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
}

export default function AddressAutocomplete({ 
  initialValue = "", 
  onAddressSelect,
  className = ""
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: "weekly", // Estandarizado a weekly
      libraries: ["marker", "places", "maps"],
      language: "es",
    });

    let isMounted = true;
    let autocompleteElement: any = null;

    loader.load().then(async (google) => {
      if (!isMounted || !containerRef.current) return;

      const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
      
      // BLINDAJE REACT: Verificar si ya existe para evitar duplicados y errores de removeChild
      if (containerRef.current.querySelector('gmpx-place-autocomplete')) {
        setIsLoaded(true);
        return;
      }

      autocompleteElement = new PlaceAutocompleteElement({
        componentRestrictions: { country: "ar" },
        types: ["address"],
      });

      autocompleteElement.classList.add("w-full");
      
      // Limpiar de forma segura (sin tocar nodos de React si es posible)
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(autocompleteElement);
      }

      autocompleteElement.addEventListener("gmp-placeselect", (event: any) => {
        const place = event.place;
        if (!place.location) return;

        const formattedAddress = place.formattedAddress || "";
        setInputValue(formattedAddress);
        onAddressSelect(formattedAddress, place.location.lat(), place.location.lng());
      });

      setIsLoaded(true);
    }).catch((e) => {
      console.error("Error loading Google Maps (weekly):", e);
      if (isMounted) setError("Error al cargar el buscador");
    });

    return () => {
      isMounted = false;
      // Limpieza total del contenedor para que React no intente borrar nodos inexistentes
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [onAddressSelect]);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>
      
      {/* Contenedor estático para inyección manual */}
      <div 
        ref={containerRef} 
        className={`w-full min-h-[56px] bg-slate-800 border border-white/10 rounded-2xl text-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 ${className}`}
      >
        {!isLoaded && (
          <div className="px-12 py-3.5 text-slate-500 italic">Inicializando buscador...</div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
      
      <style jsx global>{`
        gmpx-place-autocomplete {
          --gmpx-font-family: inherit;
          --gmpx-bg-color: transparent;
          --gmpx-color: white;
          width: 100%;
        }
        gmpx-place-autocomplete input {
          background: transparent !important;
          border: none !important;
          color: white !important;
          padding-left: 3rem !important;
          height: 54px !important;
          font-size: 0.875rem !important;
        }
      `}</style>
    </div>
  );
}
