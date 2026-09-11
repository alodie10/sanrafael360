"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, PencilLine } from "lucide-react";
import Link from "next/link";
import { getStrapiUrl } from "@/lib/strapi";

type Categoria = { id?: number; documentId: string; nombre: string };

type Created = {
  documentId: string;
  nombre: string;
  slug: string;
  categoria?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export default function AdminCreateNegocioPanel({ jwt }: { jwt: string }) {
  const strapiUrl = getStrapiUrl();
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }),
    [jwt]
  );

  const [categories, setCategories] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    fetch(`${strapiUrl}/api/categorias?sort=nombre:asc&pagination[limit]=1000`)
      .then((res) => res.json())
      .then((json) => setCategories(json.data || []))
      .catch(() => setError("No se pudieron cargar las categorías"));
  }, [strapiUrl]);

  const resetForm = () => {
    setNombre("");
    setSlug("");
    setSlugTouched(false);
    setCategoriaId("");
    setDireccion("");
    setTelefono("");
    setCreated(null);
    setError(null);
  };

  const handleCreate = async () => {
    if (!nombre.trim() || !categoriaId) {
      setError("Nombre y categoría son obligatorios");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/negocios/admin`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          nombre: nombre.trim(),
          slug: slug.trim() || slugify(nombre),
          categoriaId,
          direccion: direccion.trim() || undefined,
          telefono: telefono.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo crear el negocio");
      setCreated(json.data as Created);
    } catch (e: any) {
      setError(e.message || "Error al crear");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-create-negocio-panel">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2 italic">Crear negocio</h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Alta mínima para fichas que no vienen de Places. Después completás el resto en el editor del portal, como siempre.
        </p>
      </div>

      {created ? (
        <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 p-8 space-y-4" data-testid="admin-create-negocio-success">
          <p className="text-lg font-serif font-bold text-white italic">{created.nombre} ya está en el directorio</p>
          <p className="text-sm text-zinc-400 font-mono">/negocios/{created.slug}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/portal/negocios/${created.slug}/editar?returnTo=/portal/admin`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest"
              data-testid="admin-create-negocio-edit"
            >
              <PencilLine className="w-4 h-4" /> Completar ficha
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Crear otro
            </button>
          </div>
        </div>
      ) : (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
          )}
          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Ej. Taller Los Álamos"
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white"
              data-testid="admin-create-negocio-nombre"
            />
          </label>
          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-sm"
              data-testid="admin-create-negocio-slug"
            />
          </label>
          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Categoría</span>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white appearance-none"
              data-testid="admin-create-negocio-categoria"
            >
              <option value="">Seleccionar…</option>
              {categories.map((cat) => (
                <option key={cat.documentId} value={cat.documentId}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 block">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dirección (opcional)</span>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle y número"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white"
              />
            </label>
            <label className="space-y-2 block">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Teléfono (opcional)</span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="2604..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            data-testid="admin-create-negocio-submit"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            Crear negocio
          </button>
        </section>
      )}
    </div>
  );
}
