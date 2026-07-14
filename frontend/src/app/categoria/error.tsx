"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CategoriaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[categoria]", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">
        Categoría
      </p>
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 italic">
        No pudimos cargar esta categoría
      </h1>
      <p className="text-slate-400 max-w-md mb-8">
        Hubo un error inesperado. Podés reintentar o seguir explorando.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-8 py-3 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
