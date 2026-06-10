"use client";

import { motion } from "framer-motion";
import { 
  Eye, 
  MousePointer2, 
  MessageSquare, 
  TrendingUp,
  Search,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: any;
  trend?: string;
  color: string;
}

function StatCard({ title, value, label, icon: Icon, trend, color }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm group hover:border-primary/20 transition-all shadow-2xl shadow-black/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-3xl font-serif font-bold text-white mb-1">{value}</h3>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
    </motion.div>
  );
}

export default function PortalStats() {
  const { data: session } = useSession();
  const [data, setData] = useState({
    views: 0,
    leads: 0,
    clicks: 0,
    score: 0,
    loading: true
  });
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadStats = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      const strapiToken = (session as any)?.jwt || process.env.STRAPI_API_TOKEN;
      
      let url = `${strapiUrl}/api/negocios/stats/summary`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${strapiToken}`
        },
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Error en API: ${response.status}`);
      
      const res = await response.json();
      const payload = res.data || {};
      const stats = payload.summary || payload || { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0 };
      const bkd = payload.breakdown || [];

      setData({
        views: stats.views || 0,
        leads: stats.clicks_whatsapp || 0,
        clicks: stats.clicks_website || 0,
        score: stats.totalNegocios > 0 ? 85 : 0,
        loading: false
      });
      setBreakdown(bkd);
    } catch (e) {
      console.error("Error loading stats:", e);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (session) loadStats();
  }, [session, startDate, endDate]);

  const stats = [
    {
      title: "Visitas Totales",
      value: data.loading ? "..." : data.views.toLocaleString(),
      label: "Usuarios que vieron el perfil",
      icon: Eye,
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    {
      title: "Clicks a la Web",
      value: data.loading ? "..." : data.clicks.toLocaleString(),
      label: "Tráfico enviado a sitios externos",
      icon: MousePointer2,
      color: "bg-primary/10 border-primary/20 text-primary"
    },
    {
      title: "Contactos WhatsApp",
      value: data.loading ? "..." : data.leads.toLocaleString(),
      label: "Consultas directas generadas",
      icon: MessageSquare,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Salud del Perfil",
      value: data.loading ? "..." : `${data.score}%`,
      label: "Basado en info completada",
      icon: TrendingUp,
      color: "bg-amber-500/10 border-amber-500/20 text-amber-400"
    }
  ];

  const filteredBreakdown = breakdown.filter(b => b.nombre?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 mb-16">
      
      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">Filtro de Fechas</h2>
          <p className="text-sm text-zinc-400">Selecciona un período para ver el rendimiento histórico.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Desde:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Hasta:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="text-sm text-primary hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {!data.loading && breakdown.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Desglose por Negocio</h3>
              <p className="text-sm text-zinc-400">Rendimiento individual detallado de las {breakdown.length} fichas.</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Buscar negocio..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full md:w-64 bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/50 text-xs uppercase font-black tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Negocio</th>
                  <th className="px-6 py-4 text-center">Visitas</th>
                  <th className="px-6 py-4 text-center">Clicks Web</th>
                  <th className="px-6 py-4 text-center">Contactos WSP</th>
                  <th className="px-6 py-4 text-center">Total Interacciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBreakdown.length > 0 ? filteredBreakdown.map((b, i) => {
                  const total = b.views + b.clicks_whatsapp + b.clicks_website;
                  return (
                    <tr key={b.documentId || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <span className="truncate max-w-[200px] sm:max-w-[300px] block" title={b.nombre}>{b.nombre}</span>
                        {b.is_premium && (
                          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-yellow-500/20" title={`Válido hasta: ${b.premium_valid_until ? new Date(b.premium_valid_until).toLocaleDateString() : 'Activo'}`}>
                            <Crown className="w-3 h-3" />
                            Premium
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-400 font-bold">{b.views.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-primary font-bold">{b.clicks_website.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-emerald-400 font-bold">{b.clicks_whatsapp.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center font-bold text-white bg-white/5">{total.toLocaleString()}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron negocios con ese nombre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
