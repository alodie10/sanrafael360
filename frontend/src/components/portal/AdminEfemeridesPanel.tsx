"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarHeart,
  ExternalLink,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import { getStrapiUrl, getStrapiMedia } from "@/lib/strapi";
import {
  dateInputToEndOfDayISO,
  dateInputToStartOfDayISO,
  formatCalendarDate,
  toDateInputValue,
} from "@/lib/calendar-date";
import type { Efemeride, EfemeridePremiumPickerItem } from "@/types/strapi";

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
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [selectedNegocios, setSelectedNegocios] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const openFicha = async (documentId: string) => {
    setError(null);
    setSelectedId(documentId);
    try {
      const res = await fetch(`${strapiUrl}/api/efemerides/admin/${documentId}`, {
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "No se pudo abrir la ficha");
        return;
      }
      const data = json.data as Efemeride;
      setFicha(data);
      setDesde(toDateInputValue(data.vigente_desde));
      setHasta(toDateInputValue(data.vigente_hasta));
      setSelectedNegocios(data.negocios || []);
      setSearch("");
    } catch (e: any) {
      setError(e.message || "No se pudo abrir la ficha");
    }
  };

  const saveFicha = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/efemerides/admin/${selectedId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          vigente_desde: desde ? dateInputToStartOfDayISO(desde) : null,
          vigente_hasta: hasta ? dateInputToEndOfDayISO(hasta) : null,
          negocioIds: selectedNegocios,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo guardar");
      const data = json.data as Efemeride;
      setFicha(data);
      setDesde(toDateInputValue(data.vigente_desde));
      setHasta(toDateInputValue(data.vigente_hasta));
      setSelectedNegocios(data.negocios || []);
      await loadList();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
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

  if (ficha && selectedId) {
    const cover = ficha.encabezado?.url ? getStrapiMedia(ficha.encabezado.url) : null;
    const badge = statusBadge(ficha);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8" data-testid="admin-efemerides-ficha">
        <button
          type="button"
          onClick={() => { setFicha(null); setSelectedId(null); }}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>

        <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.03]">
          {cover && (
            <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
          )}
          <div className="p-6 md:p-8 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-serif font-bold text-white italic">{ficha.nombre}</h2>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">/{ficha.slug}</p>
            {ficha.descripcion && <p className="text-sm text-zinc-400">{ficha.descripcion}</p>}
            {ficha.publicationStatus === "published" && (
              <a
                href={`/efemerides/${ficha.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Ver página pública <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vigencia</h3>
          <p className="text-sm text-zinc-400">
            Pasada la fecha tope, la página pública se desactiva sola.
          </p>
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

        <button
          type="button"
          disabled={saving}
          onClick={saveFicha}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          data-testid="efemeride-save"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar ficha
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8" data-testid="admin-efemerides-panel">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2 italic">Efemérides</h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Creá el encabezado y el slug en Strapi (Content Manager → Efeméride). Acá listás, abrís la ficha, definís la vigencia y elegís quiénes participan.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {list.length === 0 ? (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-16 text-center">
          <CalendarHeart className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
          <p className="text-zinc-500 font-serif italic text-xl">Todavía no hay efemérides.</p>
          <p className="text-sm text-zinc-600 mt-2">Crealas en Strapi como hacés con las categorías.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => {
            const badge = statusBadge(item);
            return (
              <button
                key={item.documentId}
                type="button"
                onClick={() => openFicha(item.documentId)}
                className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:border-primary/40 px-6 py-5 transition-all"
                data-testid={`efemeride-row-${item.documentId}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-serif font-bold text-white">{item.nombre}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-1">/efemerides/{item.slug}</p>
                  </div>
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
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
