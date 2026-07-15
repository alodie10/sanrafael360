"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  Trash2,
  Unlink,
  UserRound,
} from "lucide-react";
import { getStrapiUrl } from "@/lib/strapi";
import ClienteMailEditor from "./ClienteMailEditor";

type NegocioRef = {
  documentId: string;
  nombre: string;
  slug?: string;
};

type Cliente = {
  documentId: string;
  email: string;
  nombre: string;
  notas?: string;
  opt_out?: boolean;
  negocios?: NegocioRef[];
};

type Props = {
  jwt: string;
  adminEmail?: string;
};

export default function AdminClientesPanel({ jwt, adminEmail }: Props) {
  const strapiUrl = getStrapiUrl();
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    }),
    [jwt]
  );

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ email: "", nombre: "", notas: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [linkClienteId, setLinkClienteId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<any[]>([]);

  const [mail, setMail] = useState({
    subject: "",
    bodyHtml: "<p>Hola,</p><p>Te contamos una novedad de San Rafael 360…</p>",
  });
  const [mailStatus, setMailStatus] = useState<string | null>(null);

  const bodyIsEmpty = (() => {
    const text = mail.bodyHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();
    return text.length === 0;
  })();

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin`, { headers: authHeaders });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo cargar clientes");
      setClientes(json.data || []);
    } catch (e: any) {
      setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, strapiUrl]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const createCliente = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo crear");
      setForm({ email: "", nombre: "", notas: "" });
      await loadClientes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleOptOut = async (cliente: Cliente) => {
    setBusy(true);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/${cliente.documentId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ opt_out: !cliente.opt_out }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || "No se pudo actualizar");
      }
      await loadClientes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteCliente = async (documentId: string) => {
    if (!confirm("¿Eliminar este cliente? Se desvinculan sus negocios.")) return;
    setBusy(true);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/${documentId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setSelectedIds((ids) => ids.filter((id) => id !== documentId));
      await loadClientes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const searchNegocios = async (query: string) => {
    setPickerSearch(query);
    if (query.trim().length < 2) {
      setPickerResults([]);
      return;
    }
    const res = await fetch(
      `${strapiUrl}/api/clientes/admin/negocios-picker?search=${encodeURIComponent(query)}`,
      { headers: authHeaders }
    );
    const json = await res.json().catch(() => ({}));
    setPickerResults(json.data || []);
  };

  const linkNegocio = async (negocioId: string) => {
    if (!linkClienteId) return;
    setBusy(true);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/${linkClienteId}/vincular-negocios`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ negocioIds: [negocioId] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "No se pudo vincular");
      setLinkClienteId(null);
      setPickerSearch("");
      setPickerResults([]);
      await loadClientes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const unlinkNegocio = async (clienteId: string, negocioId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/${clienteId}/desvincular-negocio`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ negocioId }),
      });
      if (!res.ok) throw new Error("No se pudo desvincular");
      await loadClientes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setMailStatus(null);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/mail/test`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          subject: mail.subject,
          bodyHtml: mail.bodyHtml,
          toEmail: adminEmail,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "Falló el mail de prueba");
      setMailStatus(`Prueba enviada a ${json.data?.to || adminEmail}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendBroadcast = async () => {
    const audience = selectedIds.length > 0 ? "selected" : "all";
    const label =
      audience === "selected"
        ? `${selectedIds.length} cliente(s) seleccionado(s)`
        : "TODOS los clientes sin opt-out";
    if (!confirm(`¿Enviar a ${label}? Usá primero «Mail de prueba».`)) return;

    setBusy(true);
    setMailStatus(null);
    setError(null);
    try {
      const res = await fetch(`${strapiUrl}/api/clientes/admin/mail/broadcast`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          subject: mail.subject,
          bodyHtml: mail.bodyHtml,
          audience,
          documentIds: audience === "selected" ? selectedIds : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || "Falló el broadcast");
      setMailStatus(`Enviado ${json.data?.sent}/${json.data?.total} (fallidos: ${json.data?.failed})`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10" data-testid="admin-clientes-panel">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2 italic">Clientes</h2>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Directorio comercial (1 email = 1 cliente). Alta y vínculo de negocios solo manual. Opt-out excluye del broadcast.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {mailStatus && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {mailStatus}
        </div>
      )}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Nuevo cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            data-testid="cliente-email-input"
          />
          <input
            className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            data-testid="cliente-nombre-input"
          />
          <input
            className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white"
            placeholder="Notas (opcional)"
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={createCliente}
          className="px-5 py-2.5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          data-testid="cliente-create-btn"
        >
          Guardar cliente
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Directorio ({clientes.length})
          </h3>
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {selectedIds.length} seleccionado(s) para mail
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-zinc-500 text-sm">Todavía no hay clientes. Cargá el primero arriba.</p>
        ) : (
          <ul className="space-y-3">
            {clientes.map((c) => (
              <li
                key={c.documentId}
                className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.includes(c.documentId)}
                      onChange={() => toggleSelect(c.documentId)}
                      disabled={Boolean(c.opt_out)}
                    />
                    <div className="min-w-0">
                      <p className="text-white font-serif font-bold text-lg flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-primary shrink-0" />
                        {c.nombre}
                      </p>
                      <p className="text-zinc-400 text-sm truncate">{c.email}</p>
                      {c.notas && <p className="text-zinc-500 text-xs mt-1">{c.notas}</p>}
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleOptOut(c)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        c.opt_out
                          ? "border-amber-500/40 text-amber-300"
                          : "border-white/10 text-zinc-400"
                      }`}
                    >
                      {c.opt_out ? "Opt-out ON" : "Recibe avisos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (linkClienteId === c.documentId) {
                          setLinkClienteId(null);
                          setPickerSearch("");
                          setPickerResults([]);
                          return;
                        }
                        setLinkClienteId(c.documentId);
                        setPickerSearch("");
                        setPickerResults([]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        linkClienteId === c.documentId
                          ? "border-primary/40 text-primary"
                          : "border-white/10 text-zinc-300"
                      }`}
                    >
                      Vincular negocio
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCliente(c.documentId)}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20 text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {(c.negocios?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 pl-7">
                    {c.negocios!.map((n) => (
                      <span
                        key={n.documentId}
                        className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] text-zinc-300"
                      >
                        <Building2 className="w-3 h-3 text-primary" />
                        {n.nombre}
                        <button
                          type="button"
                          title="Desvincular"
                          onClick={() => unlinkNegocio(c.documentId, n.documentId)}
                          className="text-zinc-500 hover:text-white"
                        >
                          <Unlink className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {linkClienteId === c.documentId && (
                  <div
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
                    data-testid="cliente-vincular-picker"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" /> Buscar negocio para vincular
                    </h4>
                    <input
                      className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white"
                      placeholder="Nombre del negocio…"
                      value={pickerSearch}
                      onChange={(e) => searchNegocios(e.target.value)}
                      autoFocus
                    />
                    <ul className="space-y-2">
                      {pickerResults.map((n) => (
                        <li
                          key={n.documentId}
                          className="flex items-center justify-between gap-3 text-sm text-zinc-200"
                        >
                          <span>
                            {n.nombre}
                            {n.cliente?.email ? (
                              <span className="text-amber-400/80 text-xs ml-2">
                                (ya: {n.cliente.email})
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            onClick={() => linkNegocio(n.documentId)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-black text-[9px] font-black uppercase"
                          >
                            Vincular
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkClienteId(null);
                        setPickerResults([]);
                        setPickerSearch("");
                      }}
                      className="text-[10px] uppercase tracking-widest text-zinc-500"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" /> Aviso a clientes
        </h3>
        <input
          className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white"
          placeholder="Asunto"
          value={mail.subject}
          onChange={(e) => setMail((m) => ({ ...m, subject: e.target.value }))}
          data-testid="cliente-mail-subject"
        />
        <ClienteMailEditor
          value={mail.bodyHtml}
          onChange={(bodyHtml) => setMail((m) => ({ ...m, bodyHtml }))}
          data-testid="cliente-mail-body"
        />
        <p className="text-[11px] text-zinc-500">
          Sin selección: envía a todos sin opt-out. Con checkboxes: solo selección. Siempre probá primero.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !mail.subject.trim() || bodyIsEmpty}
            onClick={sendTest}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            data-testid="cliente-mail-test-btn"
          >
            <Send className="w-3.5 h-3.5" /> Mail de prueba
          </button>
          <button
            type="button"
            disabled={busy || !mail.subject.trim() || bodyIsEmpty}
            onClick={sendBroadcast}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            data-testid="cliente-mail-broadcast-btn"
          >
            <Mail className="w-3.5 h-3.5" /> Enviar broadcast
          </button>
        </div>
      </section>
    </div>
  );
}
