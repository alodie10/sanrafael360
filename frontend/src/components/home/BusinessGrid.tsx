"use client";

import { motion } from "framer-motion";
import BusinessCard from "./BusinessCard";
import BusinessCardSkeleton from "./BusinessCardSkeleton";
import { Negocio } from "@/types/strapi";

interface BusinessGridProps {
  negocios: Negocio[];
  loading?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function BusinessGrid({ negocios, loading = false }: BusinessGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {[...Array(6)].map((_, i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (negocios.length === 0) {
    return (
      <div className="text-center py-24 px-6 bg-slate-900/20 rounded-[3rem] border border-white/5 backdrop-blur-sm">
        <div className="text-5xl mb-6 opacity-30">🏔️</div>
        <h3 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h3>
        <p className="text-slate-400 max-w-sm mx-auto">Prueba ajustando tus filtros o vuelve a intentarlo más tarde.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
    >
      {negocios.map((negocio, index) => (
        <BusinessCard 
          key={negocio.id} 
          negocio={negocio} 
          index={index} 
        />
      ))}
    </motion.div>
  );
}
