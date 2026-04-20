"use client";

import { useState, useEffect } from "react";
import { Clock, History, Building2, User as UserIcon, AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

interface ActivityLogViewProps {
  jwt: string;
  userId?: number; // Si se provee, filtra por el usuario (dueño)
}

export default function ActivityLogView({ jwt, userId }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      // Sanitizar el ID en caso de que traiga sufijos como :1
      const cleanUserId = userId?.toString().split(':')[0];
      const filterQuery = cleanUserId ? `&filters[usuario][id][$eq]=${cleanUserId}` : "";

      try {
        const res = await fetch(`${strapiUrl}/api/actividades?populate=*&sort=createdAt:desc${filterQuery}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        const data = await res.json();
        setActivities(data.data || []);
      } catch (e) {
        console.error("Error fetching activity logs:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [jwt, userId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-20 text-center">
           <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
           <p className="text-zinc-500 font-serif italic text-xl">Sin actividad reciente registrada</p>
        </div>
      ) : (
        <div className="relative">
          {/* Línea de tiempo vertical */}
          <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-white/5 md:left-8" />
          
          <div className="space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative pl-14 md:pl-20">
                {/* Punto de la línea de tiempo */}
                <div className="absolute left-[21px] md:left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-primary shadow-[0_0_10px_rgba(255,200,0,0.3)] transition-all hover:scale-150" />
                
                <div className="bg-zinc-950/40 border border-white/5 p-6 rounded-[2rem] hover:border-primary/20 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/20">
                         {getIcon(act.tipo)}
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">{act.accion}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4 italic">\"{act.detalles}\"</p>
                  
                  {(act.negocio || act.usuario) && (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                      {act.negocio && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                          <Building2 className="w-3.5 h-3.5 text-primary/50" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{act.negocio.nombre}</span>
                        </div>
                      )}
                      {act.usuario && !userId && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                          <UserIcon className="w-3.5 h-3.5 text-primary/50" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{act.usuario.username}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
