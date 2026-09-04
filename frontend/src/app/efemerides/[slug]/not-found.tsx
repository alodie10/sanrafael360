import Link from "next/link";

export default function EfemerideNotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center pt-32">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">
        Efeméride
      </p>
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 italic">
        Esta efeméride no está vigente
      </h1>
      <p className="text-slate-400 max-w-md mb-8">
        El enlace no existe o la fecha tope ya pasó.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary/90 transition-colors"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
