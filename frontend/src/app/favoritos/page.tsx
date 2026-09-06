import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Heart } from "lucide-react";
import Link from "next/link";
import FavoritosClient from "./FavoritosClient";
import { noIndexPage } from "@/lib/seo";

export const metadata = noIndexPage(
  "/favoritos",
  "Mis favoritos",
  "Los lugares que más te gustaron de San Rafael."
);

export default async function FavoritosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-6 flex flex-col items-center justify-center">
        <Heart className="w-16 h-16 text-slate-700 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Iniciá sesión</h1>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Para poder guardar tus lugares favoritos y tenerlos siempre a mano necesitas iniciar sesión.
        </p>
        <Link 
          href="/login?callbackUrl=/favoritos"
          className="bg-primary text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          Mis Favoritos
        </h1>
        <p className="text-slate-400 text-lg">
          Los lugares que más te gustaron de San Rafael.
        </p>
      </div>

      <div className="mt-8">
        <FavoritosClient />
      </div>
    </div>
  );
}
