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

    // Regla 3: Unificación de versión y librerías en todo el proyecto
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker", "maps"],
      language: "es",
    });

    let isMounted = true;

    loader.load().then((google) => {
      if (isMounted) setGoogleMaps(google);
    }).catch((e) => {
      console.error("Error al cargar Google Maps API (Senior Clean):", e);
      if (isMounted) setError("Error al cargar el script de Google Maps");
    });

    return () => {
      isMounted = false;
      // Regla 2: El mapa de Google tiene su propio ciclo de vida, 
      // pero evitamos cualquier manipulación externa aquí.
    };
  }, []);

  useEffect(() => {
    if (googleMaps && mapRef.current) {
      try {
        // Regla 1 & 2: Limpieza antes de nueva instancia para evitar duplicados en el mismo nodo
        mapRef.current.replaceChildren();
        
        const map = new googleMaps.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          mapId: "sanrafael360_map_id", 
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Marcador Avanzado (Sintaxis 2025)
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
      <div className="w-full h-full min-h-[300px] rounded-3xl bg-slate-900 flex items-center justify-center border border-white/5 p-8 text-center text-slate-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
      {/* Regla 1: El div contenedor es ESTÁTICO y no se desmonta condicionalmente */}
      <div ref={mapRef} className="w-full h-full" />
      
      {!googleMaps && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
