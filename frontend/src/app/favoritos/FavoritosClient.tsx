"use client";

import { useFavorites } from "@/context/FavoritesContext";
import BusinessGrid from "@/components/home/BusinessGrid";

import { Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritosClient() {
  const { favoriteObjects, favorites, isLoading } = useFavorites();

  const displayedObjects = favoriteObjects.filter(obj => favorites.includes(obj.documentId));

  if (!isLoading && displayedObjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 bg-white/5 rounded-3xl border border-white/10">
        <Heart className="w-16 h-16 text-white/20 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Aún no tienes favoritos</h2>
        <p className="text-slate-400 max-w-md">
          Explora San Rafael y toca el corazón en los lugares que más te gusten para guardarlos aquí.
        </p>
        <Link 
          href="/"
          className="mt-8 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-full transition-colors"
        >
          Explorar San Rafael
        </Link>
      </div>
    );
  }

  return <BusinessGrid negocios={displayedObjects} loading={isLoading} filterFavorites={true} />;
}
