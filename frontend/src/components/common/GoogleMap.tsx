"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
}



export default function GoogleMap({ lat, lng, zoom = 15, title }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMaps, setGoogleMaps] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError("Falta la API Key de Google Maps");
      return;
    }

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["marker", "places", "maps"],
      language: "es",
    });

    loader.load().then((google) => {
      setGoogleMaps(google);
    }).catch((e) => {
      console.error("Error al cargar Google Maps API:", e);
      setError("Error al cargar el script de Google Maps");
    });
  }, []);

  useEffect(() => {
    if (googleMaps && mapRef.current) {
      try {
        const map = new googleMaps.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          mapId: "e9e8f6e7f7b7f7b7", // Usar un ID de mapa real si existe para custom styling
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Marcador Avanzado
        new googleMaps.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map,
          title: title || "Ubicación",
        });

      } catch (err) {
        console.error("Error al instanciar el mapa:", err);
      }
    }
  }, [googleMaps, lat, lng, zoom, title]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[300px] rounded-3xl bg-slate-900 flex items-center justify-center border border-white/5 p-8 text-center">
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <div ref={mapRef} className="w-full h-full" />
      {!googleMaps && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
