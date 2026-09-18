"use client";

import Link from "next/link";
import type { CrmContacto, CrmEstado } from "@/lib/crm";
import { CRM_ESTADOS, formatCrmFecha } from "@/lib/crm";

export type CrmCategoria = { documentId: string; nombre: string };

type Props = {
  contactos: CrmContacto[];
  categorias: CrmCategoria[];
  onEnviar: (documentId: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  onCategoria: (documentId: string, categoriaId: string) => Promise<void>;
  onCrearFicha: (documentId: string) => Promise<void>;
  canCrearFicha: boolean;
  busyId: string | null;
};

export default function CrmContactList({
  contactos,
  categorias,
  onEnviar,
  onEstado,
  onCategoria,
  onCrearFicha,
  canCrearFicha,
  busyId,
}: Props) {
  if (!contactos.length) {
    return (
      <p className="text-zinc-500 text-sm" data-testid="crm-empty">
        Todavía no hay contactos en la cola. Cargá uno a mano o pegá el JSON de la IA.
      </p>
    );
  }

  return (
    <ul className="space-y-3" data-testid="crm-contact-list">
      {contactos.map((c) => (
        <CrmContactoRow
          key={c.documentId}
          contacto={c}
          categorias={categorias}
          onEnviar={onEnviar}
          onEstado={onEstado}
          onCategoria={onCategoria}
          onCrearFicha={onCrearFicha}
          canCrearFicha={canCrearFicha}
          busy={busyId === c.documentId}
        />
      ))}
    </ul>
  );
}

function CrmContactoRow({
  contacto: c,
  categorias,
  onEnviar,
  onEstado,
  onCategoria,
  onCrearFicha,
  canCrearFicha,
  busy,
}: {
  contacto: CrmContacto;
  categorias: CrmCategoria[];
  onEnviar: (documentId: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  onCategoria: (documentId: string, categoriaId: string) => Promise<void>;
  onCrearFicha: (documentId: string) => Promise<void>;
  canCrearFicha: boolean;
  busy: boolean;
}) {
  const ready = Boolean(c.nombre && c.telefono && c.categoriaId);
  return (
    <li
      data-testid="crm-contacto-row"
      className="p-5 rounded-3xl border border-white/10 bg-white/5 flex flex-col gap-4"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <p className="text-white font-serif text-xl italic">{c.nombre}</p>
          <p className="text-zinc-500 text-xs mt-1">
            {c.telefono || "sin teléfono"} · {c.origen} · {formatCrmFecha(c.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            data-testid="crm-estado-cola"
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
          <button
            type="button"
            data-testid="crm-enviar-wsp"
            disabled={busy || c.no_contactar || !c.telefono}
            onClick={() => onEnviar(c.documentId)}
            className="px-4 py-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
          >
            WhatsApp
          </button>
        </div>
      </div>
      {canCrearFicha && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            data-testid="crm-categoria"
            value={c.categoriaId || ""}
            onChange={(e) => onCategoria(c.documentId, e.target.value)}
            className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 min-w-[12rem]"
          >
            <option value="">Categoría</option>
            {categorias.map((cat) => (
              <option key={cat.documentId} value={cat.documentId}>
                {cat.nombre}
              </option>
            ))}
          </select>
          {c.negocio?.slug ? (
            <Link
              href={`/negocios/${c.negocio.slug}`}
              data-testid="crm-ficha-link"
              className="px-4 py-2 border border-primary/40 text-primary font-black uppercase tracking-widest text-[10px] rounded-xl"
            >
              Ver ficha
            </Link>
          ) : (
            <button
              type="button"
              data-testid="crm-crear-ficha"
              disabled={busy || !ready}
              onClick={() => onCrearFicha(c.documentId)}
              className="px-4 py-2 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 disabled:opacity-40"
            >
              Crear ficha
            </button>
          )}
        </div>
      )}
    </li>
  );
}
