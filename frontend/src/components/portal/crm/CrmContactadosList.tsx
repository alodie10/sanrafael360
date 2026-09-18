"use client";

import { useEffect, useState } from "react";
import type { CrmContacto, CrmEstado } from "@/lib/crm";
import { CRM_ESTADOS, formatCrmFecha } from "@/lib/crm";

type Props = {
  contactos: CrmContacto[];
  selectedId: string | null;
  onSelect: (documentId: string | null) => void;
  onNota: (documentId: string, nota: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  busy: boolean;
};

export default function CrmContactadosList({
  contactos,
  selectedId,
  onSelect,
  onNota,
  onEstado,
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
      {contactos.map((row) => (
        <CrmContactadoRow
          key={row.documentId}
          contacto={row}
          open={selectedId === row.documentId}
          onSelect={onSelect}
          onNota={onNota}
          onEstado={onEstado}
          busy={busy}
        />
      ))}
    </ul>
  );
}

function CrmContactadoRow({
  contacto: c,
  open,
  onSelect,
  onNota,
  onEstado,
  busy,
}: {
  contacto: CrmContacto;
  open: boolean;
  onSelect: (documentId: string | null) => void;
  onNota: (documentId: string, nota: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  busy: boolean;
}) {
  const [nota, setNota] = useState(c.nota || "");
  const dirty = nota !== (c.nota || "");

  useEffect(() => {
    setNota(c.nota || "");
  }, [c.nota]);

  return (
    <li className="rounded-2xl border border-white/5 bg-zinc-950/40">
      <button
        type="button"
        data-testid="crm-contactado-nombre"
        onClick={() => onSelect(open ? null : c.documentId)}
        className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 md:gap-6 items-center text-left px-5 py-4 hover:border-primary/40"
      >
        <span className="text-white font-medium underline-offset-4 decoration-white/20 hover:underline">
          {c.nombre || "Contacto"}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">
          {CRM_ESTADOS.find((e) => e.id === c.estado)?.label || c.estado}
        </span>
        <span className="text-xs text-zinc-400">{formatCrmFecha(c.createdAt)}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4" data-testid="crm-contactado-detalle">
          <select
            data-testid="crm-estado"
            value={c.estado}
            onChange={(e) => onEstado(c.documentId, e.target.value as CrmEstado)}
            className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2"
          >
            {CRM_ESTADOS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
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
            onClick={() => onNota(c.documentId, nota)}
            className="px-4 py-2 border border-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
          >
            Guardar comentario
          </button>
        </div>
      )}
    </li>
  );
}
