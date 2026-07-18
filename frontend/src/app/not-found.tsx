import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 italic">
        Página no encontrada
      </h1>
      <p className="text-slate-400 max-w-md mb-8">
        El enlace puede estar roto o el contenido ya no existe.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary/90 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
