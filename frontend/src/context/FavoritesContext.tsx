"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: string[];
  favoriteObjects: any[];
  isFavorite: (documentId: string) => boolean;
  toggleFavorite: (documentId: string) => Promise<void>;
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteObjects, setFavoriteObjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Ref para evitar que un fetch en background sobreescriba un estado optimista reciente
  const lastToggleTime = useRef<number>(0);

  const fetchFavorites = useCallback(async () => {
    if (status !== 'authenticated') {
      setFavorites([]);
      setFavoriteObjects([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/favoritos');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Normalizar: strapi.db.query puede devolver document_id (snake) o documentId (camel)
        const objects = json.data.map((b: any) => ({
          ...b,
          documentId: b.documentId || b.document_id || '',
        }));
        const docs = objects.map((b: any) => b.documentId).filter(Boolean);
        setFavorites(docs);
        setFavoriteObjects(objects);
      }
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (documentId: string) => favorites.includes(documentId),
    [favorites]
  );

  const toggleFavorite = async (documentId: string) => {
    if (status !== 'authenticated') return;

    const wasAdding = !favorites.includes(documentId);
    
    // Registrar el momento del toggle para evitar que fetchFavorites lo sobreescriba
    lastToggleTime.current = Date.now();

    // Update optimista INMEDIATO — esta es la fuente de verdad para la UI del corazón
    if (wasAdding) {
      setFavorites(prev => [...prev, documentId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== documentId));
      setFavoriteObjects(prev => prev.filter(obj => obj.documentId !== documentId));
    }

    try {
      const res = await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Revertir solo si el servidor falló
        if (wasAdding) {
          setFavorites(prev => prev.filter(id => id !== documentId));
        } else {
          // Recargar desde servidor para restaurar
          await fetchFavorites();
        }
        toast.error("Hubo un error al guardar tu favorito.");
      } else {
        const actionDone: string = json.action;
        if (actionDone === 'added') {
          toast.success("¡Guardado en favoritos! ❤️");
          // Sincronizar estado real con el servidor (por si estaba desincronizado)
          setFavorites(prev => prev.includes(documentId) ? prev : [...prev, documentId]);
          
          // Fetch en background para traer el objeto completo (tarjeta) para la página de favoritos
          fetch('/api/favoritos')
            .then(r => r.json())
            .then(data => {
              if (data.success && Array.isArray(data.data)) {
                const objects = data.data.map((b: any) => ({
                  ...b,
                  documentId: b.documentId || b.document_id || '',
                }));
                setFavoriteObjects(objects);
              }
            })
            .catch(() => {});
        } else {
          toast.success("Eliminado de favoritos");
          // Sincronizar estado real con el servidor
          setFavorites(prev => prev.filter(id => id !== documentId));
          setFavoriteObjects(prev => prev.filter(obj => obj.documentId !== documentId));
        }
      }
    } catch (error) {
      // Error de red — revertir
      if (wasAdding) {
        setFavorites(prev => prev.filter(id => id !== documentId));
      } else {
        await fetchFavorites();
      }
      toast.error("Error de conexión");
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteObjects, isFavorite, toggleFavorite, isLoading, fetchFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
