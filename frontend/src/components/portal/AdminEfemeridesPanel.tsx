"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarHeart,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { getStrapiUrl, getStrapiMedia } from "@/lib/strapi";
import { slugifyEfemeride } from "@/lib/efemerides";
import {
  dateInputToEndOfDayISO,
  dateInputToStartOfDayISO,
  formatCalendarDate,
  toDateInputValue,
} from "@/lib/calendar-date";
import type { Efemeride, EfemeridePremiumPickerItem, EfemerideTipo, ParticipanteExterno } from "@/types/strapi";
import FeriaParticipantesEditor from "./FeriaParticipantesEditor";
import EfemerideIdentityEditor from "./EfemerideIdentityEditor";

type Props = { jwt: string };

function statusBadge(item: Efemeride) {
  if (item.publicationStatus !== "published") {
    return { label: "Borrador", className: "bg-white/10 text-zinc-300" };
  }
  if (!item.vigente) {
    return { label: "Vencida", className: "bg-red-500/15 text-red-300" };
  }
  return { label: "Vigente", className: "bg-emerald-500/15 text-emerald-300" };
}

function tipoLabel(tipo?: EfemerideTipo) {
  return tipo === "feria" ? "Feria" : "Efeméride";
}

function emptyFicha(): Efemeride {
  return {
    documentId: "",
    nombre: "",
    slug: "",
    tipo: "efemeride",
    descripcion: "",
    encabezado: null,
    publicationStatus: "draft",
    negocios: [],
    participantes_externos: [],
  };
}

export default function AdminEfemeridesPanel({ jwt }: Props) {
  const strapiUrl = getStrapiUrl();
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    }),
    [jwt]
  );

  const [list, setList] = useState<Efemeride[]>([]);
  const [picker, setPicker] = useState<EfemeridePremiumPickerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Efemeride | null>(null);
  const [tipo, setTipo] = useState<EfemerideTipo>("efemeride");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [publicado, setPublicado] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [selectedNegocios, setSelectedNegocios] = useState<string[]>([]);
  const [participantesExternos, setParticipantesExternos] = useState<ParticipanteExterno[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = Boolean(ficha) && !selectedId;

  const loadList = useCallback(async () => {
    const res = await fetch(`${strapiUrl}/api/efemerides/admin`, { headers: authHeaders });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || "No se pudieron cargar las efemérides");
    setList(json.data || []);
  }, [authHeaders, strapiUrl]);

  const loadPicker = useCallback(async () => {
    const res = await fetch(`${strapiUrl}/api/efemerides/admin/premium-picker`, {
      headers: authHeaders,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || "No se pudieron cargar los premium");
    setPicker(json.data || []);
  }, [authHeaders, strapiUrl]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadList(), loadPicker()])
      .catch((e) => setError(e.message || "Error al cargar"))
      .finally(() => setLoading(false));
  }, [loadList, loadPicker]);

  const hydrateFicha = (data: Efemeride, nextId: string | null) => {
    setSelectedId(nextId);
    setFicha(data);
    setTipo(data.tipo === "feria" ? "feria" : "efemeride");
    setNombre(data.nombre || "");
    setSlug(data.slug || "");
    setSlugTouched(Boolean(nextId));
    setDescripcion(data.descripcion || "");
    setPublicado(data.publicationStatus === "published" || !nextId);
    setDesde(toDateInputValue(data.vigente_desde));
    setHasta(toDateInputValue(data.vigente_hasta));
    setSelectedNegocios(data.negocios || []);
    setParticipantesExternos(data.participantes_externos || []);
    setCoverFile(null);
    setRemoveCover(false);
    setCoverPreview(data.encabezado?.url ? getStrapiMedia(data.encabezado.url) : null);
    setSearch("");
  };

  const openCreate = () => {
    setError(null);
    hydrateFicha(emptyFicha(), null);
    setPublicado(true);
  };

  const closeFicha = () => {
    setFicha(null);
    setSelectedId(null);
  };

  const openFicha = async (documentId: string) => {
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/efemerides/admin/${documentId}`, {
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "No se pudo abrir la ficha");
        return;
      }
      hydrateFicha(json.data as Efemeride, documentId);
    } catch (e: any) {
      setError(e.message || "No se pudo abrir la ficha");
    }
  };

  const uploadCover = async (file: File) => {
    const form = new FormData();
    form.append("encabezado", file);
    const res = await fetch(`${strapiUrl}/api/efemerides/admin/encabezado`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || "No se pudo subir la imagen");
    return json.data?.id as number;
  };

  const saveFicha = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let encabezadoId: number | null | undefined;
      if (coverFile) encabezadoId = await uploadCover(coverFile);
      else if (removeCover) encabezadoId = null;

      const body = {
        nombre: nombre.trim(),
        slug: slug.trim() || slugifyEfemeride(nombre),
        descripcion,
        tipo,
        publicado,
        vigente_desde: desde ? dateInputToStartOfDayISO(desde) : null,
        vigente_hasta: hasta ? dateInputToEndOfDayISO(hasta) : null,
        negocioIds: selectedNegocios,
        participantes_externos: participantesExternos,
        ...(encabezadoId !== undefined ? { encabezadoId } : {}),
      };

      const url = selectedId
        ? `${strapiUrl}/api/efemerides/admin/${selectedId}`
        : `${strapiUrl}/api/efemerides/admin`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo guardar");
      const data = json.data as Efemeride;
      hydrateFicha(data, data.documentId);
      await loadList();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const deleteFicha = async (documentId: string) => {
    if (!confirm("¿Eliminar este registro? Deja de verse en el sitio público.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/efemerides/admin/${documentId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo eliminar");
      closeFicha();
      await loadList();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPicker = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return picker;
    return picker.filter((p) => p.label.toLowerCase().includes(q));
  }, [picker, search]);

  const toggleNegocio = (id: string) => {
    setSelectedNegocios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500" data-testid="admin-efemerides-panel">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (ficha) {
    const badge = statusBadge({
      ...ficha,
      publicationStatus: publicado ? "published" : "draft",
    });
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8" data-testid="admin-efemerides-ficha">
        <button
          type="button"
          onClick={closeFicha}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-serif font-bold text-white italic">
            {isNew ? "Nueva ficha" : nombre || ficha.nombre}
          </h2>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-zinc-200">
            {tipoLabel(tipo)}
          </span>
          {!isNew && (
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.className}`}>
              {badge.label}
            </span>
          )}
          {!isNew && publicado && slug && (
            <a
              href={`/efemerides/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              Ver página pública <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tipo de registro</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo("efemeride")}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                tipo === "efemeride"
                  ? "bg-primary text-black border-primary"
                  : "bg-black/20 text-zinc-400 border-white/10 hover:text-white"
              }`}
              data-testid="efemeride-tipo-efemeride"
            >
              Efeméride
            </button>
            <button
              type="button"
              onClick={() => setTipo("feria")}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                tipo === "feria"
                  ? "bg-primary text-black border-primary"
                  : "bg-black/20 text-zinc-400 border-white/10 hover:text-white"
              }`}
              data-testid="efemeride-tipo-feria"
            >
              Feria
            </button>
          </div>
        </section>

        <EfemerideIdentityEditor
          nombre={nombre}
          slug={slug}
          descripcion={descripcion}
          publicado={publicado}
          coverPreview={coverPreview}
          onNombre={(value) => {
            setNombre(value);
            if (!slugTouched) setSlug(slugifyEfemeride(value));
          }}
          onSlug={(value) => {
            setSlugTouched(true);
            setSlug(value);
          }}
          onDescripcion={setDescripcion}
          onPublicado={setPublicado}
          onCoverFile={(file) => {
            if (!file) return;
            setCoverFile(file);
            setRemoveCover(false);
            setCoverPreview(URL.createObjectURL(file));
          }}
          onRemoveCover={() => {
            setCoverFile(null);
            setRemoveCover(true);
            setCoverPreview(null);
          }}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vigencia</h3>
          <p className="text-sm text-zinc-400">Pasada la fecha tope, la página pública se desactiva sola.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Desde</span>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white [color-scheme:dark]"
                data-testid="efemeride-desde"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hasta</span>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white [color-scheme:dark]"
                data-testid="efemeride-hasta"
              />
            </label>
          </div>
        </section>

        {tipo === "feria" ? (
          <FeriaParticipantesEditor items={participantesExternos} onChange={setParticipantesExternos} />
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Participantes premium ({selectedNegocios.length})
              </h3>
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar negocio o rubro"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                  data-testid="efemeride-picker-search"
                />
              </div>
            </div>
            <div className="max-h-[28rem] overflow-y-auto space-y-1 pr-1" data-testid="efemeride-picker-list">
              {filteredPicker.map((p) => {
                const checked = selectedNegocios.includes(p.documentId);
                return (
                  <label
                    key={p.documentId}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-colors ${
                      checked
                        ? "bg-primary/10 border-primary/30"
                        : "bg-black/20 border-transparent hover:border-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNegocio(p.documentId)}
                      className="accent-primary w-4 h-4"
                      data-testid={`efemeride-check-${p.documentId}`}
                    />
                    <span className="text-sm text-white">{p.label}</span>
                  </label>
                );
              })}
              {filteredPicker.length === 0 && (
                <p className="text-sm text-zinc-500 py-8 text-center">No hay clientes premium para mostrar.</p>
              )}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={saveFicha}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            data-testid="efemeride-save"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Crear ficha" : "Guardar ficha"}
          </button>
          {!isNew && selectedId && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => deleteFicha(selectedId)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              data-testid="efemeride-delete"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8" data-testid="admin-efemerides-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2 italic">Efemérides y Ferias</h2>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Creá, editá o borré fechas y ferias acá. El tipo define si los participantes salen de SR360 o de un listado libre.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest"
          data-testid="efemeride-create"
        >
          <Plus className="w-4 h-4" /> Nueva ficha
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {list.length === 0 ? (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-16 text-center">
          <CalendarHeart className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
          <p className="text-zinc-500 font-serif italic text-xl">Todavía no hay efemérides ni ferias.</p>
          <p className="text-sm text-zinc-600 mt-2">Usá “Nueva ficha” para cargar la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => {
            const badge = statusBadge(item);
            return (
              <div
                key={item.documentId}
                className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-primary/40 px-6 py-5 transition-all flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => openFicha(item.documentId)}
                  className="flex-1 text-left min-w-[12rem]"
                  data-testid={`efemeride-row-${item.documentId}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-serif font-bold text-white">{item.nombre}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 text-zinc-400">
                      {tipoLabel(item.tipo)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mt-1">/efemerides/{item.slug}</p>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {item.participantesCount || 0} participantes
                  </span>
                  {item.vigente_hasta && (
                    <span className="text-[10px] text-zinc-400">
                      Hasta {formatCalendarDate(item.vigente_hasta)}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.className}`}>
                    {badge.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteFicha(item.documentId)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
                    aria-label={`Eliminar ${item.nombre}`}
                    data-testid={`efemeride-delete-${item.documentId}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
