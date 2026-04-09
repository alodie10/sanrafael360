"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchFromStrapi, getStrapiMedia } from "@/lib/strapi";

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    if (status === "authenticated" && session?.jwt) {
      // Load user's businesses
      // We pass the JWT so Strapi knows who the user is.
      // We fetch all businesses where owner === session.user.id
      const loadUserBusinesses = async () => {
        try {
          setPortalError(null);
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
          
          console.log(`🔍 Llamando a endpoint de propiedad /me para el portal...`);
          
          const res = await fetch(`${strapiUrl}/api/negocios/me`, {
            headers: {
              "Authorization": `Bearer ${session.jwt}`
            }
          });
          
          if (!res.ok) {
            if (res.status === 403) {
              setPortalError("Acceso denegado: No tienes permisos para ver esta sección. Contacta al soporte.");
            } else {
              setPortalError(`Error del servidor (${res.status}). Intenta nuevamente más tarde.`);
            }
            return;
          }

          const data = await res.json();
          console.log("📦 Respuesta del Portal (/me):", data);

          if (data.data) {
            setNegocios(data.data);
          }
        } catch (e) {
          console.error("❌ Fallo cargando negocios en el portal:", e);
          setPortalError("Error de conexión. Verifica tu internet.");
        } finally {
          setLoading(false);
        }
      };

      loadUserBusinesses();
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex justify-center text-white">
        <p>Cargando portal...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Portal de Anunciante</h1>
          <p className="text-slate-400">Bienvenido/a, {session.user?.name || session.user?.email}. Aquí puedes gestionar tus negocios.</p>
        </div>
        <button 
          onClick={() => {
            // SignOut logic requires next-auth/react
            import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: "/" }));
          }}
          className="px-4 py-2 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4">Mis Negocios</h2>
        
        {portalError ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-red-500 font-bold mb-2">Hubo un problema</h3>
            <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
              {portalError}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl hover:bg-red-600/30 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : negocios.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl text-center">
             <div className="text-4xl mb-4">🏪</div>
             <h3 className="text-white font-bold mb-2">Aún no tienes negocios</h3>
             <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
               Parece que no tienes ningún negocio reclamado o asignado. Vuelve al directorio y busca tu negocio para reclamarlo.
             </p>
             <Link href="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform">
               Ir al Directorio
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {negocios.map(negocio => (
              <div key={negocio.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="flex gap-4 items-center mb-6">
                  <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {negocio.logo?.url ? (
                       <img src={getStrapiMedia(negocio.logo.url)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <div className="text-2xl font-bold text-primary">{negocio.nombre.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{negocio.nombre}</h3>
                    
                    {/* Badge de estado */}
                    {negocio.estado_reclamo === 'pendiente' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-500 rounded-md mt-1 border border-amber-500/20">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                         Revisión pendiente
                      </span>
                    )}
                    {negocio.estado_reclamo === 'aprobado' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-green-500/10 text-green-500 rounded-md mt-1 border border-green-500/20">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                         Aprobado
                      </span>
                    )}
                    {(negocio.estado_reclamo === 'ninguno' || !negocio.estado_reclamo) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 rounded-md mt-1 border border-blue-500/20">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                         Asignado
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
                  <Link 
                    href={`/negocios/${negocio.slug}`}
                    className="flex-1 text-center py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Ver público
                  </Link>
                  <Link 
                    href={`/portal/negocios/${negocio.slug}/editar`}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-bold text-center rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10"
                  >
                    Editar Perfil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
