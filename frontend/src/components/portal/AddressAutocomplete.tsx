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
      version: "weekly",
      libraries: ["marker", "places", "maps"],
      language: "es",
    });

    loader.load().then(async (google) => {
      // Importar la librería de places de forma moderna (v3.56+)
      const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
      
      if (!containerRef.current) return;

      // Crear el elemento de autocompletado moderno (Web Component)
      const autocompleteElement = new PlaceAutocompleteElement({
        componentRestrictions: { country: "ar" },
        types: ["address"],
      });

      // Estilizar el Shadow DOM para Pro Vibe (limitado, pero podemos aplicar clases al contenedor)
      autocompleteElement.classList.add("w-full");
      
      // Limpiar contenedor y añadir el nuevo elemento
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(autocompleteElement);

      // Listener para cambios de lugar (Sintaxis 2025)
      autocompleteElement.addEventListener("gmp-placeselect", (event: any) => {
        const place = event.place;
        
        if (!place.location) {
          return;
        }

        const lat = place.location.lat();
        const lng = place.location.lng();
        const formattedAddress = place.formattedAddress || "";

        setInputValue(formattedAddress);
        onAddressSelect(formattedAddress, lat, lng);
      });

      setIsLoaded(true);
    }).catch((e) => {
      console.error("Error loading Google Maps v2025:", e);
      setError("Error al cargar autocompletado moderno");
    });
  }, [onAddressSelect]);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>
      
      <div 
        ref={containerRef} 
        className={`w-full min-h-[56px] bg-slate-800 border border-white/10 rounded-2xl text-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 ${className}`}
      >
        {!isLoaded && (
          <div className="px-12 py-3.5 text-slate-500 italic">Cargando buscador...</div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
      
      {/* Estilos inyectados para el Web Component de Google */}
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
