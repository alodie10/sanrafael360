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
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep a stable ref to the callback so the Loader effect doesn't re-run on every parent render
  const callbackRef = useRef(onAddressSelect);
  useEffect(() => { callbackRef.current = onAddressSelect; }, [onAddressSelect]);

  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker", "maps"],
      language: "es",
    });

    let isMounted = true;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    loader.load().then((google) => {
      if (!isMounted || !inputRef.current) return;

      // RESTAURACIÓN: Usar la API clásica que ya está habilitada en el proyecto
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ar" },
        types: ["address"],
        fields: ["formatted_address", "geometry"]
      });

      // Listener clásico de Google Maps — usa callbackRef para evitar cierre desactualizado
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        
        if (!place || !place.geometry || !place.geometry.location) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || "";

        setInputValue(formattedAddress);
        callbackRef.current(formattedAddress, lat, lng);
      });

      setIsLoaded(true);
    }).catch((e) => {
      console.error("Error loading Google Maps (Classic Restoration):", e);
      if (isMounted) setError("Error al cargar autocompletado");
    });

    return () => {
      isMounted = false;
      // Limpieza de listeners de Google
      if (autocomplete && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []); // Empty deps — Loader is a singleton; callbackRef handles stale closure

  // Sincronizar el valor inicial si cambia externamente (ej: al cargar los datos del negocio)
  useEffect(() => {
    if (initialValue && initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isLoaded ? "Buscar dirección..." : "Cargando buscador..."}
        className={`w-full h-14 pl-12 pr-6 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 ${className}`}
      />

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
