"use client";
/* v20-stabilized-dom */

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

    // Regla 3: Unificación de versión y librerías
    const loader = new Loader({
      apiKey,
      version: "weekly", 
      libraries: ["places", "marker", "maps"],
      language: "es",
    });

    let isMounted = true;
    let observer: MutationObserver | null = null;
    let autocompleteElement: any = null;

    loader.load().then(async (google) => {
      if (!isMounted || !containerRef.current) return;

      const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
      
      // Evitar duplicados si el componente se re-renderiza sin desmontarse
      if (containerRef.current.querySelector('gmpx-place-autocomplete')) {
        setIsLoaded(true);
        return;
      }

      autocompleteElement = new PlaceAutocompleteElement({
        componentRestrictions: { country: "ar" },
        types: ["address"],
      });

      autocompleteElement.classList.add("w-full");
      
      // Inyección segura
      if (containerRef.current) {
        containerRef.current.replaceChildren(autocompleteElement);
        
        // Cargar valor inicial si existe para que el usuario vea su dirección actual al editar
        if (initialValue) {
          // El Web Component de Google expone el input interno tras un pequeño delay o al asignarle valor
          setInputValue(initialValue);
          // Intentamos asignar el valor al componente (algunas versiones usan valor de atributo o propiedad directa)
          autocompleteElement.value = initialValue;
        }
      }

      // Regla 2: Listener con cleanup implícito
      const handleSelect = (event: any) => {
        const place = event.place;
        if (!place || !place.location) return;

        const formattedAddress = place.formattedAddress || "";
        setInputValue(formattedAddress);
        onAddressSelect(formattedAddress, place.location.lat(), place.location.lng());
      };

      autocompleteElement.addEventListener("gmp-placeselect", handleSelect);

      setIsLoaded(true);
    }).catch((e) => {
      console.error("Error loading Google Maps (Senior Clean):", e);
      if (isMounted) setError("Error al cargar buscador");
    });

    // Regla 2: Cleanup Riguroso
    return () => {
      isMounted = false;
      if (observer) observer.disconnect();
      if (containerRef.current) {
        // No destruir el div, solo limpiar su contenido para la siguiente montura
        containerRef.current.replaceChildren();
      }
    };
  }, [onAddressSelect]);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>

      {/* CRÍTICO: Este div está absolutamente vacío en el JSX.
          React NUNCA gestiona sus hijos. Solo Google Maps lo usa.
          El placeholder de carga vive en un div HERMANO, no adentro. */}
      <div className={`relative w-full min-h-[56px] bg-slate-800 border border-white/10 rounded-2xl text-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 ${className}`}>
        {/* Placeholder gestionado por React — vive FUERA del ref */}
        {!isLoaded && (
          <div className="absolute inset-0 px-12 py-3.5 text-slate-500 italic flex items-center gap-2 pointer-events-none">
            <Loader2 className="w-3 h-3 animate-spin" />
            Empieza a escribir...
          </div>
        )}
        {/* Contenedor para Google Maps — React no lo toca por dentro */}
        <div ref={containerRef} className="w-full h-full" />
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
