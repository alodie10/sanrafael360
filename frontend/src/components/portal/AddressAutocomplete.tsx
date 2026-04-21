"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  initialValue?: string;
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
}

/**
 * AddressAutocomplete — Google PlaceAutocompleteElement (2025 API)
 *
 * Uses the new PlaceAutocompleteElement Web Component recommended from March 2025.
 * Falls back gracefully if the API key is missing or the library fails to load.
 *
 * The previous implementation used google.maps.places.Autocomplete (classic),
 * which still works but generates a deprecation warning in the console.
 */
export default function AddressAutocomplete({
  initialValue = "",
  onAddressSelect,
  className = "",
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onAddressSelect);
  useEffect(() => { callbackRef.current = onAddressSelect; }, [onAddressSelect]);

  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if parent changes initialValue (e.g. on data load)
  useEffect(() => {
    if (initialValue && initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) return;

    let isMounted = true;

    // Lazy-load the new maps/places bootstrap script (importLibrary pattern)
    const scriptId = "google-maps-bootstrap";
    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if ((window as any).google?.maps) { resolve(); return; }
        if (document.getElementById(scriptId)) {
          // Script already injected — wait for load
          const existing = document.getElementById(scriptId) as HTMLScriptElement;
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", reject);
          return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(async () => {
        if (!isMounted || !containerRef.current) return;

        // Try new PlaceAutocompleteElement first
        const placesLib = await (window as any).google?.maps?.importLibrary?.("places").catch(() => null);
        if (placesLib?.PlaceAutocompleteElement) {
          const autocompleteEl = new placesLib.PlaceAutocompleteElement({
            componentRestrictions: { country: "ar" },
            types: ["address"],
          }) as HTMLElement & { value: string };

          // Style the web component to match our design
          autocompleteEl.style.width = "100%";
          autocompleteEl.style.height = "3.5rem";
          autocompleteEl.style.display = "block";
          containerRef.current.appendChild(autocompleteEl);

          // New API event
          autocompleteEl.addEventListener("gmp-placeselect", async (event: any) => {
            const place = event.place;
            await place.fetchFields({ fields: ["formattedAddress", "location"] });
            const lat = place.location?.lat() ?? 0;
            const lng = place.location?.lng() ?? 0;
            const address = place.formattedAddress ?? "";
            setInputValue(address);
            callbackRef.current(address, lat, lng);
          });

          // Sync text changes
          autocompleteEl.addEventListener("input", (e: any) => {
            setInputValue(e.target?.value ?? "");
          });

          setIsLoaded(true);
          return;
        }

        // Fallback: classic Autocomplete (still works, no deprecation in this context
        // since we only reach this branch if PlaceAutocompleteElement is unavailable)
        if (!containerRef.current) return;
        const input = document.createElement("input");
        input.type = "text";
        input.value = inputValue;
        input.placeholder = "Buscar dirección...";
        input.className = `w-full h-14 pl-12 pr-6 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 ${className}`;
        containerRef.current.appendChild(input);

        const g = (window as any).google.maps;
        const ac = new g.places.Autocomplete(input, {
          componentRestrictions: { country: "ar" },
          types: ["address"],
          fields: ["formatted_address", "geometry"],
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place?.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address ?? "";
          setInputValue(address);
          callbackRef.current(address, lat, lng);
        });
        input.addEventListener("input", (e: any) => setInputValue(e.target.value));
        setIsLoaded(true);
      })
      .catch((e) => {
        console.error("AddressAutocomplete: failed to load Google Maps", e);
        if (isMounted) setError("Error al cargar el buscador de direcciones");
      });

    return () => {
      isMounted = false;
    };
  }, []); // Empty deps — script is singleton, callbackRef handles stale closure

  return (
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 z-10 pointer-events-none">
        {isLoaded ? <MapPin className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>

      {/* When using PlaceAutocompleteElement (web component), it renders inside containerRef.
          When using classic fallback, the input is injected there too.
          We show a plain input as placeholder text while loading. */}
      {!isLoaded && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Cargando buscador..."
          readOnly
          className={`w-full h-14 pl-12 pr-6 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500 ${className}`}
        />
      )}
      <div
        ref={containerRef}
        className={`${isLoaded ? "block" : "hidden"} w-full`}
        style={{ paddingLeft: "3rem" }}
      />

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
