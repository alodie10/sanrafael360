"use client";

import { useEffect, useState } from "react";
import { CRM_ESTADOS, SIN_CAMPANA, formatCrmFecha, idAlcanzado, type CrmAlcanzado, type CrmEnvio, type CrmEstado } from "@/lib/crm";

export type CrmNotaItem = { texto: string; createdAt: string };

type Props = {
  contactos: CrmAlcanzado[];
  selectedIds: string[];
  onToggle: (documentId: string) => void;
  selectedId: string | null;
  onSelect: (documentId: string | null) => void;
  onNota: (documentId: string, nota: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  onLoadNotas: (documentId: string) => Promise<CrmNotaItem[]>;
  busy: boolean;
};

export default function CrmContactadosList({
  contactos,
  selectedIds,
  onToggle,
  selectedId,
  onSelect,
  onNota,
  onEstado,
  onLoadNotas,
  busy,
}: Props) {
  if (!contactos.length) {
    return (
      <p className="text-zinc-500 text-sm italic" data-testid="crm-alcanzados-empty">
        No hay contactos alcanzados con este filtro. Aparecen acá cuando abrís WhatsApp.
      </p>
    );
  }

  return (
    <ul className="space-y-2" data-testid="crm-alcanzados">
      {contactos.map((row) => {
        const id = idAlcanzado(row);
        return (
          <CrmContactadoRow
            key={id}
            contacto={row}
            checked={selectedIds.includes(id)}
            onToggle={() => onToggle(id)}
            open={selectedId === id}
            onSelect={onSelect}
            onNota={onNota}
            onEstado={onEstado}
            onLoadNotas={onLoadNotas}
            busy={busy}
          />
        );
      })}
    </ul>
  );
}

function CampanaChips({ envios }: { envios: CrmEnvio[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {envios.map((envio, index) => (
        <span
          key={`${envio.campana}-${envio.enviadoAt}-${index}`}
          data-testid="crm-campana-chip"
          className="px-2 py-0.5 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-zinc-300"
        >
          {envio.campana} · {formatCrmFecha(envio.enviadoAt)}
        </span>
      ))}
    </span>
  );
}

function CrmContactadoRow({
  contacto: c,
  checked,
  onToggle,
  open,
  onSelect,
  onNota,
  onEstado,
  onLoadNotas,
  busy,
}: {
  contacto: CrmAlcanzado;
  checked: boolean;
  onToggle: () => void;
  open: boolean;
  onSelect: (documentId: string | null) => void;
  onNota: (documentId: string, nota: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  onLoadNotas: (documentId: string) => Promise<CrmNotaItem[]>;
  busy: boolean;
}) {
  const id = idAlcanzado(c);
  const envios = c.envios?.length
    ? c.envios
    : [{ campana: SIN_CAMPANA, enviadoAt: c.enviadoAt, plantillaIndex: null }];
  const notaGuardada = c.nota || "";
  const [nota, setNota] = useState(notaGuardada);
  const [notaBase, setNotaBase] = useState(notaGuardada);
  const [historial, setHistorial] = useState<CrmNotaItem[]>([]);
  if (notaGuardada !== notaBase) {
    setNotaBase(notaGuardada);
    setNota(notaGuardada);
  }
  const dirty = nota !== notaGuardada;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    onLoadNotas(id)
      .then((rows) => {
        if (!cancelled) setHistorial(rows);
      })
      .catch(() => {
        if (!cancelled) setHistorial([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, id, onLoadNotas]);

  return (
    <li className="rounded-2xl border border-white/5 bg-zinc-950/40">
      <div className="flex items-start gap-3 px-4 py-2.5">
        <input
          type="checkbox"
          data-testid="crm-alcanzado-check"
          checked={checked}
          onChange={onToggle}
          aria-label={`Seleccionar ${c.nombre || "contacto"}`}
          className="mt-1 accent-primary"
        />
        <button
          type="button"
          data-testid="crm-contactado-nombre"
          onClick={() => onSelect(open ? null : id)}
          className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-2 md:gap-6 items-center text-left hover:border-primary/40"
        >
          <span className="min-w-0 space-y-1">
            <span className="block text-white font-medium underline-offset-4 decoration-white/20 hover:underline">
              {c.nombre || "Contacto"}
            </span>
            <CampanaChips envios={envios} />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            {CRM_ESTADOS.find((e) => e.id === c.estado)?.label || c.estado}
          </span>
          <span className="text-xs text-zinc-400">{formatCrmFecha(c.enviadoAt)}</span>
        </button>
      </div>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4" data-testid="crm-contactado-detalle">
          <select
            data-testid="crm-estado"
            value={c.estado}
            onChange={(e) => onEstado(id, e.target.value as CrmEstado)}
            className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2"
          >
            {CRM_ESTADOS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {historial.length > 0 && (
            <ol className="space-y-2" data-testid="crm-nota-historial">
              {historial.map((item, i) => (
                <li key={`${item.createdAt}-${i}`} className="text-sm text-zinc-300">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 mr-2">
                    {formatCrmFecha(item.createdAt)}
                  </span>
                  {item.texto}
                </li>
              ))}
            </ol>
          )}
          <textarea
            data-testid="crm-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Comentario"
            rows={3}
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-3 py-2 placeholder:text-zinc-600"
          />
          <button
            type="button"
            data-testid="crm-nota-guardar"
            disabled={busy || !dirty}
            onClick={async () => {
              await onNota(id, nota);
              const rows = await onLoadNotas(id);
              setHistorial(rows);
            }}
            className="px-4 py-2 border border-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
          >
            Guardar comentario
          </button>
        </div>
      )}
    </li>
  );
}
