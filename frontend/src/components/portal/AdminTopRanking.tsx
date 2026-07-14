"use client";

import { useEffect, useState } from "react";
import { Trophy, Eye, ExternalLink, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getStrapiUrl } from "@/lib/strapi";

export default function AdminTopRanking({ jwt }: { jwt: string }) {
  const [topNegocios, setTopNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const strapiUrl = getStrapiUrl();
        const res = await fetch(`${strapiUrl}/api/negocios?sort[0]=views:desc&pagination[limit]=5&fields[0]=nombre&fields[1]=slug&fields[2]=views`, {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: 'no-store'
        });
        const data = await res.json();
        setTopNegocios(data.data || []);
      } catch (e) {
        console.error("Error fetching top ranking", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, [jwt]);

  if (loading) return (
    <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-8 animate-pulse">
      <div className="h-6 w-48 bg-white/5 rounded-lg mb-6" />
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-xl font-serif font-bold text-white italic">Top 5 San Rafael</h3>
        </div>
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
          Ranking por Vistas
        </div>
      </div>

      <div className="space-y-3">
        {topNegocios.map((negocio, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={negocio.id}
            className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-transparent hover:border-white/5 transition-all group"
          >
            <div className="flex items-center gap-5">
              <span className="text-2xl font-serif font-black text-zinc-700 italic w-6 group-hover:text-primary transition-colors">
                0{index + 1}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{negocio.nombre}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-zinc-500 font-medium">Crecimiento Orgánico</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Eye className="w-3 h-3 text-primary" />
                  <span className="text-sm font-black text-white">{negocio.views || 0}</span>
                </div>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter">Vistas Totales</p>
              </div>
              <Link 
                href={`/negocios/${negocio.slug}`}
                target="_blank"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary hover:text-black transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
