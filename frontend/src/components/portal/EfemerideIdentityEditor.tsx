"use client";

import { ImagePlus, Trash2 } from "lucide-react";

type Props = {
  nombre: string;
  slug: string;
  descripcion: string;
  publicado: boolean;
  coverPreview: string | null;
  onNombre: (value: string) => void;
  onSlug: (value: string) => void;
  onDescripcion: (value: string) => void;
  onPublicado: (value: boolean) => void;
  onCoverFile: (file: File | null) => void;
  onRemoveCover: () => void;
};

export default function EfemerideIdentityEditor({
  nombre,
  slug,
  descripcion,
  publicado,
  coverPreview,
  onNombre,
  onSlug,
  onDescripcion,
  onPublicado,
  onCoverFile,
  onRemoveCover,
}: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ficha pública</h3>
      <label className="space-y-2 block">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nombre</span>
        <input
          value={nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Día del Padre / Feria de Emprendedores"
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white"
          data-testid="efemeride-nombre"
        />
      </label>
      <label className="space-y-2 block">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</span>
        <input
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
          placeholder="dia-del-padre"
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-sm"
          data-testid="efemeride-slug"
        />
        <p className="text-xs text-zinc-500">/efemerides/{slug || "slug"}</p>
      </label>
      <label className="space-y-2 block">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descripción</span>
        <textarea
          value={descripcion}
          onChange={(e) => onDescripcion(e.target.value)}
          rows={3}
          placeholder="Texto del encabezado público"
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white resize-y"
          data-testid="efemeride-descripcion"
        />
      </label>
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Imagen de encabezado</span>
        {coverPreview && (
          <div className="flex justify-center rounded-2xl border border-white/10 bg-black/40 p-3">
            <img
              src={coverPreview}
              alt="Vista previa del encabezado"
              className="max-h-64 w-auto max-w-full object-contain rounded-xl"
            />
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Si el afiche es vertical (Stories o foto de celular), en la landing se muestra entero como poster, sin recortar.
        </p>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-200 cursor-pointer hover:text-white">
            <ImagePlus className="w-4 h-4" />
            {coverPreview ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onCoverFile(e.target.files?.[0] || null)}
              data-testid="efemeride-cover"
            />
          </label>
          {coverPreview && (
            <button
              type="button"
              onClick={onRemoveCover}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-500/10"
              data-testid="efemeride-cover-remove"
            >
              <Trash2 className="w-4 h-4" /> Quitar
            </button>
          )}
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={publicado}
          onChange={(e) => onPublicado(e.target.checked)}
          className="accent-primary w-4 h-4"
          data-testid="efemeride-publicado"
        />
        <span className="text-sm text-zinc-300">Publicar en el sitio (si está vigente)</span>
      </label>
    </section>
  );
}
