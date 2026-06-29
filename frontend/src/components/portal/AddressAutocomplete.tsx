"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  initialValue?: string;
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
}

interface Suggestion {
  placePrediction: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toPlace: () => { fetchFields: (opts: { fields: string[] }) => Promise<{ place: any }> };
    text: { toString: () => string };
  };
}

/**
 * AddressAutocomplete
 *
 * Usa la nueva API de Places (2025) con AutocompleteSuggestion + fetchAutocompleteSuggestions.
 * Compatible con React (no usa PlaceAutocompleteElement web-component).
 * Comparte el singleton @googlemaps/js-api-loader con GoogleMap.tsx.
 */
export default function AddressAutocomplete({
  initialValue = "",
  onAddressSelect,
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const callbackRef = useRef(onAddressSelect);
  useEffect(() => { callbackRef.current = onAddressSelect; }, [onAddressSelect]);

  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencia a la sesión de autocompletado de la nueva API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionTokenRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesLibRef = useRef<any>(null);

  // Sync si el padre cambia initialValue externamente
  useEffect(() => {
    if (initialValue && initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar la librería de Places con la nueva API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let isMounted = true;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker", "maps"],
      language: "es",
    });

    loader.importLibrary("places").then((placesLib) => {
      if (!isMounted) return;
      placesLibRef.current = placesLib;
      // Crear token de sesión para agrupar requests y optimizar costos
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      setIsLoaded(true);
    }).catch((e) => {
      console.error("AddressAutocomplete: Loader failed", e);
      if (isMounted) setError("Error al cargar el buscador de direcciones");
    });

    return () => { isMounted = false; };
  }, []);

  // Buscar sugerencias con debounce
  const fetchSuggestions = useCallback(async (value: string) => {
    const placesLib = placesLibRef.current;
    if (!placesLib || value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsFetching(true);
    try {
      const request = {
        input: value,
        includedRegionCodes: ["ar"],
        sessionToken: sessionTokenRef.current,
      };
      const { suggestions: results } =
        await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      setSuggestions(results ?? []);
      setShowDropdown((results ?? []).length > 0);
    } catch (e) {
      console.error("AddressAutocomplete: fetchSuggestions failed", e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Debounce del input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  // Seleccionar una sugerencia
  const handleSelect = async (suggestion: Suggestion) => {
    const placesLib = placesLibRef.current;
    setShowDropdown(false);
    try {
      const place = suggestion.placePrediction.toPlace();
      const { place: placeWithFields } = await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });
      const address = placeWithFields.formattedAddress ?? placeWithFields.displayName ?? "";
      const lat = placeWithFields.location?.lat() ?? 0;
      const lng = placeWithFields.location?.lng() ?? 0;
      setInputValue(address);
      callbackRef.current(address, lat, lng);
      // Renovar token de sesión para el próximo ciclo de búsqueda
      if (placesLib) sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    } catch (e) {
      console.error("AddressAutocomplete: fetchFields failed", e);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded && !isFetching ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={isLoaded ? "Buscar dirección..." : "Cargando buscador..."}
        className={`w-full h-14 pl-12 pr-6 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 ${className}`}
      />

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              {s.placePrediction.text.toString()}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
