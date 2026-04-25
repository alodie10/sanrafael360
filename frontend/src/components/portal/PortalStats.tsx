"use client";

import { motion } from "framer-motion";
import { 
  Eye, 
  MousePointer2, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-tighter">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-3xl font-serif font-bold text-white mb-1">{value}</h3>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
    </motion.div>
  );
}

export default function PortalStats() {
  const stats = [
    {
      title: "Visitas Totales",
      value: "1,284",
      label: "Usuarios que vieron tu perfil",
      icon: Eye,
      trend: "+12%",
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    {
      title: "Interacciones",
      value: "84",
      label: "Clicks en Teléfono / Web / WA",
      icon: MousePointer2,
      trend: "+5%",
      color: "bg-primary/10 border-primary/20 text-primary"
    },
    {
      title: "Consultas",
      value: "12",
      label: "Mensajes directos recibidos",
      icon: MessageSquare,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Rating Promedio",
      value: "4.8",
      label: "Basado en la salud del perfil",
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
