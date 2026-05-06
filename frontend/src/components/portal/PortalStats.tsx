"use client";

import { motion } from "framer-motion";
import { 
  Eye, 
  MousePointer2, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchFromStrapi } from "@/lib/strapi";

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
        const strapiToken = (session as any)?.jwt || process.env.STRAPI_API_TOKEN;
        
        // Usamos la nueva ruta de resumen súper eficiente
        const response = await fetch(`${strapiUrl}/api/negocios/stats/summary`, {
          headers: {
            Authorization: `Bearer ${strapiToken}`
          },
          cache: 'no-store'
        });
        
        if (!response.ok) throw new Error(`Error en API: ${response.status}`);
        
        const res = await response.json();
        const stats = res.data || { views: 0, clicks_whatsapp: 0, clicks_website: 0, totalNegocios: 0 };
        
        console.log("--- DASHBOARD SUMMARY ---");
        console.log("Stats recibidas:", stats);

        setData({
          views: stats.views || 0,
          leads: stats.clicks_whatsapp || 0,
          clicks: stats.clicks_website || 0,
          score: stats.totalNegocios > 0 ? 85 : 0,
          loading: false
        });
      } catch (e) {
        console.error("Error loading stats:", e);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    if (session) loadStats();
  }, [session]);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
