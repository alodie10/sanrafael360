"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditBusinessAttributesProps {
  atributosSeleccionados: string[];
  setAtributosSeleccionados: (val: string[]) => void;
  availableAtributos: any[];
}

export default function EditBusinessAttributes({
  atributosSeleccionados,
  setAtributosSeleccionados,
  availableAtributos
}: EditBusinessAttributesProps) {
  
  const toggleAtributo = (documentId: string) => {
    setAtributosSeleccionados((prev) => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
          <Tag className="w-6 h-6 text-primary" />
          Etiquetas y Facilidades
        </h2>
        <p className="text-slate-400 text-sm">
          Selecciona las etiquetas que mejor describen los servicios y comodidades de tu negocio. Estas ayudarán a los turistas a encontrarte más fácil.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {availableAtributos.map((attr) => {
          const isSelected = atributosSeleccionados.includes(attr.documentId);
          return (
            <button
              key={attr.documentId}
              type="button"
              onClick={() => toggleAtributo(attr.documentId)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                isSelected 
                  ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                  : "bg-slate-800 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
              )}
            >
              {attr.nombre}
            </button>
          );
        })}
        {availableAtributos.length === 0 && (
          <p className="text-sm text-slate-500 italic">No hay etiquetas disponibles en este momento.</p>
        )}
      </div>
    </div>
  );
}
