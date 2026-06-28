"use client";

import { useState } from "react";
import { Tag, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditBusinessAttributesProps {
  atributosSeleccionados: string[];
  setAtributosSeleccionados: (val: string[]) => void;
  availableAtributos: any[];
  setAvailableAtributos: (val: any[]) => void;
  session: any;
}

export default function EditBusinessAttributes({
  atributosSeleccionados,
  setAtributosSeleccionados,
  availableAtributos,
  setAvailableAtributos,
  session
}: EditBusinessAttributesProps) {
  
  const [newTag, setNewTag] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const toggleAtributo = (documentId: string) => {
    const nextAtributos = atributosSeleccionados.includes(documentId) 
        ? atributosSeleccionados.filter((id: string) => id !== documentId)
        : [...atributosSeleccionados, documentId];
    setAtributosSeleccionados(nextAtributos);
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;
    setIsCreating(true);
    
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      // Formatear slug simple
      const slug = newTag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      
      const res = await fetch(`${strapiUrl}/api/atributos?status=published`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session.jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: {
            nombre: newTag.trim(),
            slug: slug,
            tipo: "tag"
          }
        })
      });

      if (res.ok) {
        const body = await res.json();
        const createdAttr = body.data;
        // Agregarlo a la lista de disponibles
        setAvailableAtributos([...availableAtributos, createdAttr]);
        // Y seleccionarlo automáticamente
        setAtributosSeleccionados([...atributosSeleccionados, createdAttr.documentId]);
        setNewTag("");
        toast.success("Etiqueta creada y seleccionada");
      } else {
        toast.error("No tienes permisos para crear. Solicita acceso al Admin.");
      }
    } catch (err) {
      toast.error("Error al crear la etiqueta");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <Tag className="w-6 h-6 text-primary" />
            Etiquetas y Facilidades
          </h2>
          <p className="text-slate-400 text-sm">
            Selecciona las etiquetas que mejor describen los servicios de tu negocio, o crea una nueva si no existe.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nueva etiqueta..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary w-40"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={isCreating || !newTag.trim()}
            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl border border-primary/30 transition-all disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
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
          <p className="text-sm text-slate-500 italic">No hay etiquetas disponibles. ¡Crea la primera!</p>
        )}
      </div>
    </div>
  );
}
