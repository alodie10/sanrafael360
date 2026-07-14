"use client";
/* v20-sanitized-id */

import { useState, useEffect } from "react";
import { Clock, History, Building2, User as UserIcon, AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { STRAPI_URL, getStrapiUrl } from "@/lib/strapi";
import { cn } from "@/lib/utils";

interface ActivityLogViewProps {
  jwt: string;
  userId?: number;
}

export default function ActivityLogView({ jwt, userId }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!jwt) {
        console.warn("[ActivityLog] No JWT found in props.");
        setLoading(false);
        return;
      }

      console.log(`[ActivityLog] Fetching from ${STRAPI_URL}/api/actividades with JWT starting with: ${jwt.substring(0, 10)}...`);
      
      const strapiUrl = getStrapiUrl();
      try {
        // Populate explícito — populate=* falla con 'Invalid key usuario' en Strapi v5
        // porque users-permissions tiene restricciones en wildcard populate.
        const params = new URLSearchParams({
          "populate[negocio][fields][0]": "nombre",
          "populate[negocio][fields][1]": "slug",
          "sort": "createdAt:desc",
          "pagination[limit]": "50",
        });
        // Solo populamos usuario si no estamos filtrando por usuario
        // (en ese caso ya sabemos quién es)
        if (!userId) {
          params.set("populate[usuario][fields][0]", "username");
          params.set("populate[usuario][fields][1]", "email");
        }

        const res = await fetch(`${strapiUrl}/api/actividades?${params.toString()}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });

        if (!res.ok) {
          console.error("[ActivityLog] Error HTTP:", res.status);
          setFetchError(true);
          return;
        }

        const data = await res.json();
        setActivities(data.data || []);
      } catch (e) {
        console.error("[ActivityLog] Error fetching:", e);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [jwt, userId]); // Una sola llamada — sin polling

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;

  if (fetchError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white font-serif italic text-xl mb-2">Error al cargar el log</p>
        <p className="text-zinc-400 text-sm">No pudimos recuperar la actividad reciente. Por favor, intenta de nuevo más tarde.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl font-mono text-[11px] leading-tight">
      {/* Terminal Header */}
      <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
          </div>
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] ml-4">system.log — San Rafael 360</span>
        </div>
        <div className="text-zinc-600">
           {activities.length} entries
        </div>
      </div>

      {/* Log Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-zinc-600 uppercase text-[9px] font-black">
              <th className="px-4 py-3 font-black">Timestamp</th>
              <th className="px-4 py-3 font-black">Action</th>
              <th className="px-4 py-3 font-black">Entity / Details</th>
              {!userId && <th className="px-4 py-3 font-black">User</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-700 italic">No activities recorded in the last 50 entries.</td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-2 whitespace-nowrap text-blue-400/70 group-hover:text-blue-400">
                    {new Date(act.createdAt).toLocaleString('es-AR', { 
                      month: 'short', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                      act.tipo === 'success' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                      act.tipo === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      act.tipo === 'warning' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    )}>
                      {act.accion}
                    </span>
                  </td>
                  <td className="px-4 py-2 max-w-md truncate text-zinc-300">
                    {act.negocio && (
                      <span className="text-primary/70 font-bold mr-2">[{act.negocio.nombre}]</span>
                    )}
                    <span className="text-zinc-500 italic">{act.detalles}</span>
                  </td>
                  {!userId && (
                    <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                      {act.usuario?.username || 'system'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
