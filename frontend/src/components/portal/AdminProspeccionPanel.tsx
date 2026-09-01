"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import { STRAPI_URL } from "@/lib/strapi";
import { getSiteUrl } from "@/lib/site";
import type { PeriodPreset } from "@/lib/performance-period";
import { rangeFromPreset } from "@/lib/performance-period";
import PerformancePeriodFilter from "./PerformancePeriodFilter";
import {
  composeFichaMensaje,
  greetingNow,
  phoneForWhatsapp,
  type ProspeccionAlcanzado,
  type ProspeccionNegocio,
  type ProspeccionPlantilla,
} from "@/lib/prospeccion";

type Props = {
  jwt: string;
  precarga: ProspeccionNegocio | null;
  onPrecargaConsumed?: () => void;
};

function apiError(json: any, fallback: string) {
  return json?.error?.message || json?.error || fallback;
}

function formatFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminProspeccionPanel({
  jwt,
  precarga,
  onPrecargaConsumed,
}: Props) {
  const authHeaders = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  const [selected, setSelected] = useState<ProspeccionNegocio | null>(precarga);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<ProspeccionNegocio[]>([]);
  const [plantilla, setPlantilla] = useState<ProspeccionPlantilla | null>(null);
  const [draft, setDraft] = useState<ProspeccionPlantilla | null>(null);
  const [editingPlantilla, setEditingPlantilla] = useState(true);
  const [alcanzados, setAlcanzados] = useState<ProspeccionAlcanzado[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const initialRange = rangeFromPreset("30d");
  const [perfPreset, setPerfPreset] = useState<PeriodPreset>("30d");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [loading, setLoading] = useState(true);
  const [savingPlantilla, setSavingPlantilla] = useState(false);
  const [sending, setSending] = useState<"saludo" | "ficha_mensaje" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!precarga?.documentId) return;
    setSelected(precarga);
    setPickerSearch("");
    setPickerResults([]);
    onPrecargaConsumed?.();
  }, [precarga, onPrecargaConsumed]);

  useEffect(() => {
    loadPlantilla();
  }, [jwt]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadAlcanzados();
    }, nameFilter ? 300 : 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, nameFilter, startDate, endDate]);

  const loadPlantilla = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/prospeccion/plantilla`, {
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo cargar la plantilla"));
      setPlantilla(json.data);
      setDraft(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAlcanzados = async () => {
    const qs = new URLSearchParams({ startDate, endDate });
    if (nameFilter.trim()) qs.set("q", nameFilter.trim());
    const res = await fetch(`${STRAPI_URL}/api/prospeccion/alcanzados?${qs}`, {
      headers: authHeaders,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setAlcanzados(json.data || []);
  };

  const searchNegocios = async (query: string) => {
    setPickerSearch(query);
    if (query.trim().length < 2) {
      setPickerResults([]);
      return;
    }
    const res = await fetch(
      `${STRAPI_URL}/api/prospeccion/negocios-picker?search=${encodeURIComponent(query)}`,
      { headers: authHeaders }
    );
    const json = await res.json().catch(() => ({}));
    setPickerResults(json.data || []);
  };

  const selectNegocio = (negocio: ProspeccionNegocio) => {
    setSelected(negocio);
    setPickerSearch("");
    setPickerResults([]);
    setError(null);
  };

  const savePlantilla = async () => {
    if (!draft) return;
    setSavingPlantilla(true);
    setError(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/prospeccion/plantilla`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo guardar la plantilla"));
      setPlantilla(json.data);
      setDraft(json.data);
      setNotice("Guardado. El mensaje es compartido; la firma quedó en tu usuario.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingPlantilla(false);
    }
  };

  const enviar = async (tipo: "saludo" | "ficha_mensaje") => {
    if (!selected) return;
    setSending(tipo);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${STRAPI_URL}/api/prospeccion/enviar`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ negocioDocumentId: selected.documentId, tipo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiError(json, "No se pudo armar el WhatsApp"));
      window.open(json.data.whatsappUrl, "_blank", "noopener,noreferrer");
      if (tipo === "saludo") {
        setNotice("WhatsApp abierto con el saludo. Si el número funciona, enviá la ficha para registrarlo.");
      } else {
        setNotice("WhatsApp abierto con la ficha y el mensaje. Quedó registrado en contactos alcanzados.");
        await loadAlcanzados();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(null);
    }
  };

  const fichaUrl = selected?.slug ? `${getSiteUrl()}/negocios/${selected.slug}` : "";
  const saludo = greetingNow();
  const phone = phoneForWhatsapp(selected);
  const preview = plantilla
    ? composeFichaMensaje({ url: fichaUrl, ...plantilla })
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20" data-testid="prospeccion-panel">
      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {notice && (
        <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{notice}</p>
        </div>
      )}

      <section className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
        <div>
          <h3 className="text-xl font-serif font-bold text-white italic">Negocio a prospectar</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Elegí un comercio del directorio o usá la precarga de Places.
          </p>
        </div>

        {selected ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4"
            data-testid="prospeccion-negocio-selected"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Building2 className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold truncate">{selected.nombre}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                  {selected.categoriaNombre || "Sin rubro"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white"
              data-testid="prospeccion-negocio-clear"
            >
              <X className="w-3.5 h-3.5" /> Cambiar
            </button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="prospeccion-negocio-picker">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={pickerSearch}
                onChange={(e) => searchNegocios(e.target.value)}
                placeholder="Buscar negocio por nombre…"
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                data-testid="prospeccion-negocio-search"
              />
            </div>
            <ul className="space-y-2">
              {pickerResults.map((n) => (
                <li key={n.documentId}>
                  <button
                    type="button"
                    onClick={() => selectNegocio(n)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left hover:border-primary/40"
                    data-testid={`prospeccion-picker-item-${n.documentId}`}
                  >
                    <span className="text-sm text-white">{n.nombre}</span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                      {n.categoriaNombre || "Sin rubro"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">WhatsApp</p>
              <p className="text-sm text-zinc-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                {phone || "Sin teléfono"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Saludo ahora</p>
              <p className="text-sm text-zinc-200">{saludo}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Ficha</p>
              <a
                href={fichaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary truncate block"
              >
                {fichaUrl}
              </a>
            </div>
          </div>
        )}

        {selected && plantilla && (
          <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-black/40 border border-white/5 rounded-2xl p-5 font-sans leading-relaxed">
            {preview}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => enviar("saludo")}
            disabled={!selected || !phone || sending !== null}
            className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-40 hover:bg-white/15 flex items-center justify-center gap-2"
            data-testid="prospeccion-enviar-saludo"
          >
            {sending === "saludo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            Enviar saludo
          </button>
          <button
            type="button"
            onClick={() => enviar("ficha_mensaje")}
            disabled={!selected || !phone || sending !== null}
            className="flex-1 py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[11px] disabled:opacity-40 hover:bg-primary/90 flex items-center justify-center gap-2"
            data-testid="prospeccion-enviar-ficha"
          >
            {sending === "ficha_mensaje" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar ficha + mensaje
          </button>
        </div>
        {selected && !phone && (
          <p className="text-xs text-amber-400">Este negocio no tiene teléfono de WhatsApp. Completalo en la ficha antes de enviar.</p>
        )}
      </section>

      <section className="bg-zinc-950/40 border border-white/10 rounded-[2.5rem] p-8 space-y-4">
        <button
          type="button"
          onClick={() => setEditingPlantilla((v) => !v)}
          className="w-full flex items-center justify-between text-left"
          data-testid="prospeccion-plantilla-toggle"
        >
          <div>
            <h3 className="text-lg font-serif font-bold text-white italic">Plantilla del mensaje</h3>
            <p className="text-sm text-zinc-500">
              El mensaje y el precio son compartidos. La firma es de cada usuario: tu esposa puede poner la suya sin cambiar la tuya.
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${editingPlantilla ? "rotate-180" : ""}`} />
        </button>
        {editingPlantilla && draft && (
          <div className="space-y-4 pt-2">
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Texto debajo de la ficha</span>
              <textarea
                value={draft.texto_ficha}
                onChange={(e) => setDraft({ ...draft, texto_ficha: e.target.value })}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                data-testid="prospeccion-plantilla-texto-ficha"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Mensaje (precio, beneficios y oferta)
              </span>
              <textarea
                value={draft.mensaje}
                onChange={(e) => setDraft({ ...draft, mensaje: e.target.value })}
                rows={8}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                data-testid="prospeccion-plantilla-mensaje"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Firma (solo tu usuario)
              </span>
              <textarea
                value={draft.firma}
                onChange={(e) => setDraft({ ...draft, firma: e.target.value })}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                data-testid="prospeccion-plantilla-firma"
              />
            </label>
            <button
              type="button"
              onClick={savePlantilla}
              disabled={savingPlantilla}
              className="px-6 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              data-testid="prospeccion-plantilla-save"
            >
              {savingPlantilla ? "Guardando…" : "Guardar plantilla"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-serif font-bold text-white italic">Contactos alcanzados</h3>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filtrar por nombre…"
            className="w-full bg-zinc-950/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-600"
            data-testid="prospeccion-filtro-nombre"
          />
        </div>
        <PerformancePeriodFilter
          preset={perfPreset}
          startDate={startDate}
          endDate={endDate}
          title="Período de contactos"
          description="Filtra el historial de negocios ya alcanzados."
          testId="prospeccion-period-filter"
          onPreset={(p) => {
            const range = rangeFromPreset(p);
            setPerfPreset(p);
            setStartDate(range.startDate);
            setEndDate(range.endDate);
          }}
          onCustom={() => setPerfPreset("custom")}
          onStartDate={(v) => {
            setPerfPreset("custom");
            setStartDate(v);
          }}
          onEndDate={(v) => {
            setPerfPreset("custom");
            setEndDate(v);
          }}
          onResetToDefault={() => {
            const range = rangeFromPreset("30d");
            setPerfPreset("30d");
            setStartDate(range.startDate);
            setEndDate(range.endDate);
          }}
        />

        <div className="space-y-2" data-testid="prospeccion-alcanzados">
          {alcanzados.length === 0 ? (
            <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-12 text-center text-zinc-500 italic">
              Todavía no hay contactos en este período.
            </div>
          ) : (
            alcanzados.map((row) => (
              <button
                key={row.documentId}
                type="button"
                onClick={() => row.negocio && selectNegocio(row.negocio)}
                className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 md:gap-6 items-center text-left rounded-2xl border border-white/5 bg-zinc-950/40 px-5 py-4 hover:border-primary/40"
                data-testid={`prospeccion-alcanzado-${row.documentId}`}
              >
                <span className="text-white font-medium">{row.negocio?.nombre || "Negocio"}</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {row.negocio?.categoriaNombre || "Sin rubro"}
                </span>
                <span className="text-xs text-zinc-400">{formatFecha(row.ultimo_envio_at)}</span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
