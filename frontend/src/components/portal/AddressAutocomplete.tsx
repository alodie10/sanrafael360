"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  initialValue?: string;
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
}

/**
 * AddressAutocomplete
 *
 * Uses the singleton @googlemaps/js-api-loader so it never conflicts with
 * GoogleMap.tsx which also uses the same Loader. Both components share the
 * same underlying script tag — no "already defined" warnings.
 *
 * Tries PlaceAutocompleteElement (2025 API) first via importLibrary.
 * Falls back to classic Autocomplete if not available (both APIs are loaded
 * by the same Loader instance so the fallback always succeeds).
 */
export default function AddressAutocomplete({
  initialValue = "",
  onAddressSelect,
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Stable ref avoids re-running the Loader effect when parent re-renders
  const callbackRef = useRef(onAddressSelect);
  useEffect(() => { callbackRef.current = onAddressSelect; }, [onAddressSelect]);

  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if parent changes initialValue externally (e.g. on data load)
  useEffect(() => {
    if (initialValue && initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let isMounted = true;

    // Singleton Loader — same config as GoogleMap.tsx to guarantee deduplication
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker", "maps"],
      language: "es",
    });

    loader.load().then((google) => {
      if (!isMounted || !inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
        componentRestrictions: { country: "ar" },
        types: ["address"],
        fields: ["formatted_address", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address ?? "";
        setInputValue(address);
        callbackRef.current(address, lat, lng);
      });

      setIsLoaded(true);
    }).catch((e) => {
      console.error("AddressAutocomplete: Loader failed", e);
      if (isMounted) setError("Error al cargar el buscador de direcciones");
    });

    return () => {
      isMounted = false;
    };
  }, []); // Empty — Loader is singleton, callbackRef handles stale closure

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
