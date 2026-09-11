"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ParticipanteExterno } from "@/types/strapi";

type Props = {
  items: ParticipanteExterno[];
  onChange: (items: ParticipanteExterno[]) => void;
};

export default function FeriaParticipantesEditor({ items, onChange }: Props) {
  const updateRow = (index: number, patch: Partial<ParticipanteExterno>) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Emprendimientos ({items.filter((row) => row.nombre.trim()).length})
        </h3>
        <button
          type="button"
          onClick={() => onChange([...items, { nombre: "", url: "" }])}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white"
          data-testid="feria-add-participante"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
      <p className="text-sm text-zinc-400">
        Armá un listado con nombre y, si hay, el link del comercio. Sirve para quienes no están en SR360.
      </p>
      <div className="space-y-3" data-testid="feria-participantes-editor">
        {items.map((row, index) => (
          <div
            key={`externo-${index}`}
            className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_auto] gap-2 rounded-2xl border border-white/10 bg-black/20 p-3"
          >
            <input
              value={row.nombre}
              onChange={(e) => updateRow(index, { nombre: e.target.value })}
              placeholder="Nombre del emprendimiento"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              data-testid={`feria-nombre-${index}`}
            />
            <input
              value={row.url || ""}
              onChange={(e) => updateRow(index, { url: e.target.value })}
              placeholder="Link opcional (web, Instagram…)"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              data-testid={`feria-url-${index}`}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
              aria-label="Quitar participante"
              data-testid={`feria-remove-${index}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-zinc-500 py-6 text-center">
            Todavía no hay emprendimientos. Agregá el primero con el botón de arriba.
          </p>
        )}
      </div>
    </section>
  );
}
