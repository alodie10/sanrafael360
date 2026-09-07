"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Plus, Save } from "lucide-react";
import { dateInputToEndOfDayISO, dateInputToStartOfDayISO } from "@/lib/calendar-date";
import {
  formatMendoza,
  guideAdminApi,
  listToInput,
  type GuideExpansionRow,
  type GuideMissRow,
  type GuideSettingsRow,
} from "@/lib/guide-admin";

type InnerTab = "misses" | "diccionario" | "ajustes";
type Props = { jwt: string };

const MATCH_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "category", label: "Solo categoría" },
  { id: "category_or_name", label: "Categoría o nombre" },
  { id: "name_or_desc", label: "Nombre o descripción" },
];

function draftFromRow(row: GuideExpansionRow): Record<string, string | boolean> {
  return {
    key: row.key,
    aliases: listToInput(row.aliases),
    queries: listToInput(row.queries),
    categories: listToInput(row.categories),
    match_mode: row.match_mode || "default",
    exclude_name_needles: listToInput(row.exclude_name_needles),
    prefer_name_needles: listToInput(row.prefer_name_needles),
    notas: row.notas || "",
    activo: row.activo,
  };
}

function emptyDraft(fromMiss?: GuideMissRow | null): Record<string, string | boolean> {
  return {
    key: fromMiss?.suggested_key || "",
    aliases: fromMiss?.raw_query || "",
    queries: (fromMiss?.expanded_queries || []).join(", "),
    categories: (fromMiss?.categories_tried || []).join(", "),
    match_mode: "default",
    exclude_name_needles: "",
    prefer_name_needles: "",
    notas: "",
    activo: true,
  };
}

export default function AdminChatbotPanel({ jwt }: Props) {
  const api = useMemo(() => guideAdminApi(jwt), [jwt]);
  const [tab, setTab] = useState<InnerTab>("misses");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [misses, setMisses] = useState<GuideMissRow[]>([]);
  const [expansions, setExpansions] = useState<GuideExpansionRow[]>([]);
  const [settings, setSettings] = useState<GuideSettingsRow | null>(null);
  const [estado, setEstado] = useState("pendiente");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromMissId, setFromMissId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [missRows, expRows, sets, cats] = await Promise.all([
        api.listMisses({
          estado,
          q,
          from: from ? dateInputToStartOfDayISO(from) : undefined,
          to: to ? dateInputToEndOfDayISO(to) : undefined,
        }),
        api.listExpansions(),
        api.getSettings(),
        api.listCategoryNames().catch(() => [] as string[]),
      ]);
      setMisses(missRows);
      setExpansions(expRows);
      setSettings(sets);
      setCategoryNames(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el módulo");
    } finally {
      setLoading(false);
    }
  }, [api, estado, q, from, to]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreateFromMiss = (row: GuideMissRow) => {
    setDraft(emptyDraft(row));
    setEditingId(null);
    setFromMissId(row.documentId);
    setTab("diccionario");
    setNotice("Completá queries o categorías y guardá. El chat lo toma en menos de un minuto.");
  };

  const openEdit = (row: GuideExpansionRow) => {
    setEditingId(row.documentId);
    setFromMissId(null);
    setDraft(draftFromRow(row));
    setTab("diccionario");
  };

  const onSaveExpansion = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveExpansion(
        {
          key: String(draft.key),
          aliases: String(draft.aliases),
          queries: String(draft.queries),
          categories: String(draft.categories),
          match_mode: String(draft.match_mode),
          exclude_name_needles: String(draft.exclude_name_needles),
          prefer_name_needles: String(draft.prefer_name_needles),
          notas: String(draft.notas),
          activo: Boolean(draft.activo),
        },
        editingId || undefined
      );
      if (fromMissId) await api.patchMiss(fromMissId, "resuelto");
      setNotice("Guardada. Probá el chat ahora: recarga el mapa en el próximo mensaje.");
      setEditingId(saved.documentId);
      setDraft(draftFromRow(saved));
      setFromMissId(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (id: InnerTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        tab === id ? "bg-primary text-black border-primary" : "border-white/10 text-zinc-400"
      }`}
      data-testid={`admin-chatbot-tab-${id}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6" data-testid="admin-chatbot-panel">
      <p className="text-sm text-zinc-400">
        Misses del chat, diccionario de expansiones y pausa/copy. Sin redeploy para un sinónimo nuevo.
      </p>
      <div className="flex flex-wrap gap-2">
        {tabBtn("misses", "Sin resultado")}
        {tabBtn("diccionario", "Diccionario")}
        {tabBtn("ajustes", "Ajustes")}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
      {loading ? (
        <p className="text-zinc-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
        </p>
      ) : null}

      {tab === "misses" && !loading ? (
        <MissesTable
          misses={misses}
          estado={estado}
          q={q}
          from={from}
          to={to}
          onEstado={setEstado}
          onQ={setQ}
          onFrom={setFrom}
          onTo={setTo}
          onIgnore={(id) =>
            api.patchMiss(id, "ignorado").then(loadAll).catch((e) => setError(e instanceof Error ? e.message : "No se pudo ignorar"))
          }
          onResolve={(id) =>
            api.patchMiss(id, "resuelto").then(loadAll).catch((e) => setError(e instanceof Error ? e.message : "No se pudo marcar"))
          }
          onCreate={openCreateFromMiss}
        />
      ) : null}

      {tab === "diccionario" && !loading ? (
        <DictionaryView
          expansions={expansions}
          draft={draft}
          setDraft={setDraft}
          editingId={editingId}
          saving={saving}
          categoryNames={categoryNames}
          onSubmit={onSaveExpansion}
          onEdit={openEdit}
          onNew={() => {
            setDraft(emptyDraft());
            setEditingId(null);
            setFromMissId(null);
          }}
          onDuplicate={(id) =>
            api.duplicateExpansion(id).then(loadAll).catch((e) => setError(e instanceof Error ? e.message : "No se pudo duplicar"))
          }
          onToggle={(row) =>
            api
              .saveExpansion({ activo: !row.activo }, row.documentId)
              .then(loadAll)
              .catch((e) => setError(e instanceof Error ? e.message : "No se pudo actualizar"))
          }
        />
      ) : null}

      {tab === "ajustes" && settings && !loading ? (
        <SettingsView
          settings={settings}
          saving={saving}
          onSave={async (next) => {
            if (next.paused && !settings.paused) {
              const ok = window.confirm("¿Pausar Rafi en el sitio? El widget se oculta.");
              if (!ok) return;
            }
            setSaving(true);
            try {
              const saved = await api.saveSettings(next);
              setSettings(saved);
              setNotice("Ajustes guardados. El sitio los toma en menos de un minuto.");
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar");
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function MissesTable({
  misses,
  estado,
  q,
  from,
  to,
  onEstado,
  onQ,
  onFrom,
  onTo,
  onIgnore,
  onResolve,
  onCreate,
}: {
  misses: GuideMissRow[];
  estado: string;
  q: string;
  from: string;
  to: string;
  onEstado: (v: string) => void;
  onQ: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onIgnore: (id: string) => void;
  onResolve: (id: string) => void;
  onCreate: (row: GuideMissRow) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={estado}
          onChange={(e) => onEstado(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          data-testid="admin-chatbot-miss-estado"
        >
          <option value="pendiente">Pendientes</option>
          <option value="resuelto">Resueltos</option>
          <option value="ignorado">Ignorados</option>
          <option value="todos">Todos</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          aria-label="Desde"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          aria-label="Hasta"
        />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Buscar query…"
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm flex-1 min-w-[12rem]"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Query</th>
              <th className="p-3">Expansión</th>
              <th className="p-3">Veces</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {misses.map((row) => (
              <tr key={row.documentId} className="border-t border-white/5" data-testid="admin-chatbot-miss-row">
                <td className="p-3 text-zinc-400 whitespace-nowrap">{formatMendoza(row.last_seen_at)}</td>
                <td className="p-3 text-white">{row.raw_query}</td>
                <td className="p-3 text-zinc-500 text-xs">
                  {(row.expanded_queries || []).join(", ") || "—"}
                  {row.categories_tried?.length ? ` · ${row.categories_tried.join(", ")}` : ""}
                </td>
                <td className="p-3">{row.count}</td>
                <td className="p-3 uppercase text-[10px] tracking-widest">{row.estado}</td>
                <td className="p-3 flex flex-wrap gap-2">
                  <button type="button" className="text-primary text-[10px] font-black uppercase" onClick={() => onCreate(row)}>
                    Crear expansión
                  </button>
                  <button type="button" className="text-zinc-400 text-[10px] uppercase" onClick={() => onResolve(row.documentId)}>
                    Resuelto
                  </button>
                  <button type="button" className="text-zinc-500 text-[10px] uppercase" onClick={() => onIgnore(row.documentId)}>
                    Ignorar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!misses.length ? <p className="p-8 text-zinc-500 italic">No hay misses con ese filtro.</p> : null}
      </div>
    </div>
  );
}

function DictionaryView({
  expansions,
  draft,
  setDraft,
  editingId,
  saving,
  categoryNames,
  onSubmit,
  onEdit,
  onNew,
  onDuplicate,
  onToggle,
}: {
  expansions: GuideExpansionRow[];
  draft: Record<string, string | boolean>;
  setDraft: (next: Record<string, string | boolean>) => void;
  editingId: string | null;
  saving: boolean;
  categoryNames: string[];
  onSubmit: (event: FormEvent) => void;
  onEdit: (row: GuideExpansionRow) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onToggle: (row: GuideExpansionRow) => void;
}) {
  const field = (name: string, label: string) => (
    <label className="block text-xs text-zinc-400 space-y-1">
      <span className="uppercase tracking-widest text-[10px]">{label}</span>
      <input
        value={String(draft[name] ?? "")}
        onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
      />
    </label>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={onSubmit} className="space-y-3 bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif italic text-xl">{editingId ? "Editar expansión" : "Nueva expansión"}</h3>
          <button type="button" onClick={onNew} className="text-[10px] uppercase tracking-widest text-zinc-400">
            <Plus className="w-3 h-3 inline" /> Nueva
          </button>
        </div>
        {field("key", "Key (ej. medico)")}
        {field("aliases", "Aliases (coma)")}
        <p className="text-[11px] text-zinc-500">
          Con key <code>mate</code> ya entra “quiero mate” / “necesito mate”. Guardá: el título tiene que decir Editar expansión.
        </p>
        {field("queries", "Queries Algolia (coma)")}
        <label className="block text-xs text-zinc-400 space-y-1">
          <span className="uppercase tracking-widest text-[10px]">Categorías exactas</span>
          <input
            value={String(draft.categories ?? "")}
            onChange={(e) => setDraft({ ...draft, categories: e.target.value })}
            list="guide-category-names"
            placeholder="Productos Regionales"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
          />
          <datalist id="guide-category-names">
            {categoryNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        {field("exclude_name_needles", "Excluir en nombre (opcional)")}
        {field("prefer_name_needles", "Preferir en nombre (opcional)")}
        <label className="block text-xs text-zinc-400 space-y-1">
          <span className="uppercase tracking-widest text-[10px]">Match</span>
          <select
            value={String(draft.match_mode)}
            onChange={(e) => setDraft({ ...draft, match_mode: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {MATCH_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <span className="text-[11px] text-zinc-500">
            Solo categoría: lista el rubro entero, aunque el nombre no diga la query.
          </span>
        </label>
        {field("notas", "Notas internas")}
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={Boolean(draft.activo)}
            onChange={(e) => setDraft({ ...draft, activo: e.target.checked })}
          />
          Activo
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] px-4 py-3 rounded-xl"
          data-testid="admin-chatbot-save-expansion"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </form>
      <div className="space-y-3">
        {expansions.map((row) => (
          <article key={row.documentId} className="border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <strong className="text-white">{row.key}</strong>
              <span className={`text-[10px] uppercase ${row.activo ? "text-emerald-400" : "text-zinc-500"}`}>
                {row.activo ? "activo" : "off"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{(row.queries || []).join(", ") || "sin queries"}</p>
            <p className="text-xs text-zinc-600">{(row.categories || []).join(" · ")}</p>
            {row.edited_by || row.updatedAt ? (
              <p className="text-[10px] text-zinc-600">
                {row.edited_by || "panel"} · {row.updatedAt ? formatMendoza(row.updatedAt) : ""}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest">
              <button type="button" className="text-primary" onClick={() => onEdit(row)}>Editar</button>
              <button type="button" className="text-zinc-400" onClick={() => onToggle(row)}>
                {row.activo ? "Desactivar" : "Activar"}
              </button>
              <button type="button" className="text-zinc-400" onClick={() => onDuplicate(row.documentId)}>
                <Copy className="w-3 h-3 inline" /> Duplicar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  settings,
  saving,
  onSave,
}: {
  settings: GuideSettingsRow;
  saving: boolean;
  onSave: (next: GuideSettingsRow) => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);

  return (
    <form
      className="space-y-4 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <label className="flex items-center gap-3 text-white">
        <input
          type="checkbox"
          checked={draft.paused}
          onChange={(e) => setDraft({ ...draft, paused: e.target.checked })}
          data-testid="admin-chatbot-pause"
        />
        Pausar chatbot (oculta el widget y /asistente)
      </label>
      <label className="block text-xs text-zinc-400 space-y-1">
        Intro
        <textarea
          value={draft.copy_intro}
          onChange={(e) => setDraft({ ...draft, copy_intro: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24"
        />
      </label>
      <label className="block text-xs text-zinc-400 space-y-1">
        Sin resultados
        <textarea
          value={draft.copy_no_results}
          onChange={(e) => setDraft({ ...draft, copy_no_results: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-20"
        />
      </label>
      <label className="block text-xs text-zinc-400 space-y-1">
        CTA anunciar
        <input
          value={draft.copy_cta_anunciar}
          onChange={(e) => setDraft({ ...draft, copy_cta_anunciar: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs text-zinc-400 space-y-1">
        URL del CTA
        <input
          value={draft.copy_cta_anunciar_url}
          onChange={(e) => setDraft({ ...draft, copy_cta_anunciar_url: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        />
      </label>
      <div className="text-xs text-zinc-500 space-y-1 border border-white/10 rounded-2xl p-4">
        <p>Modelo LLM: {settings.llm_model}</p>
        <p>Índice Algolia: {settings.algolia_index}</p>
        <p>Las API keys no se muestran.</p>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] px-4 py-3 rounded-xl"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Guardar ajustes
      </button>
    </form>
  );
}
