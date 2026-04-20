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
  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
      language: "es",
    });

    loader.load().then((google) => {
      if (!inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ar" }, // Restringir a Argentina
        fields: ["address_components", "geometry", "formatted_address"],
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || "";

        setInputValue(formattedAddress);
        onAddressSelect(formattedAddress, lat, lng);
      });

      setIsLoaded(true);
    }).catch((e) => {
      console.error("Error loading Google Places:", e);
      setError("Error al cargar autocompletado");
    });
  }, [onAddressSelect]);

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Busca tu dirección (ej: Av. Mitre 123)"
        className={`w-full pl-12 pr-5 py-3.5 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${className}`}
      />
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
