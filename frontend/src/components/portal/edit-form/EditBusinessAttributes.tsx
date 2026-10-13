"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { rubroLabel, rubrosFromSlugs, visibleAmenities } from "@/lib/place-amenity-rubros";

interface EditBusinessAttributesProps {
  atributosSeleccionados: string[];
  setAtributosSeleccionados: (val: string[]) => void;
  availableAtributos: Array<{ documentId: string; nombre?: string; tipo?: string }>;
  categoriaSlug?: string;
  listo: boolean;
  etiquetas?: Array<{ documentId: string; nombre?: string }>;
}

export default function EditBusinessAttributes({
  atributosSeleccionados,
  setAtributosSeleccionados,
  availableAtributos,
  categoriaSlug,
  listo,
  etiquetas = [],
}: EditBusinessAttributesProps) {
  const rubros = rubrosFromSlugs([categoriaSlug]);
  const visibles = visibleAmenities(availableAtributos, categoriaSlug, atributosSeleccionados);
  const etiquetasMarcadas = etiquetas.filter((item) =>
    atributosSeleccionados.includes(item.documentId)
  );

  const toggleAtributo = (documentId: string) => {
    const next = atributosSeleccionados.includes(documentId)
      ? atributosSeleccionados.filter((id) => id !== documentId)
      : [...atributosSeleccionados, documentId];
    setAtributosSeleccionados(next);
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
          <Tag className="w-6 h-6 text-primary" />
          Lo que ofrece este lugar
        </h2>
        <p className="text-slate-400 text-sm">
          {rubros.length
            ? `Solo facilidades de ${rubroLabel(rubros)}, en orden alfabético.`
            : "Esta categoría no tiene facilidades en el catálogo."}
        </p>
      </div>

      {!listo ? (
        <p className="text-sm text-slate-500">Cargando facilidades…</p>
      ) : (
        <div className="flex flex-wrap gap-3" data-testid="place-amenity-picker">
          {etiquetasMarcadas.map((attr) => {
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
          {visibles.map((attr) => {
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
          {visibles.length === 0 && (
            <p className="text-sm text-slate-500">No hay facilidades para esta categoría.</p>
          )}
        </div>
      )}
    </div>
  );
}
