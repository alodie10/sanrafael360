"use client";

import type { CrmContacto } from "@/lib/crm";

type Props = {
  contactos: CrmContacto[];
  onEnviar: (documentId: string) => void;
  busyId: string | null;
};

export default function CrmLotePanel({ contactos, onEnviar, busyId }: Props) {
  if (!contactos.length) return null;

  return (
    <section
      className="mb-4 p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3"
      data-testid="crm-lote"
    >
      <div>
        <h3 className="text-lg font-serif text-white italic">Lote para otra campaña</h3>
        <p className="text-zinc-400 text-xs mt-1">
          {contactos.length} {contactos.length === 1 ? "contacto" : "contactos"}. Elegí el mensaje y
          mandá de a uno.
        </p>
      </div>
      <ul className="space-y-2">
        {contactos.map((contacto) => (
          <li
            key={contacto.documentId}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <span className="text-white text-sm truncate">{contacto.nombre || "Contacto"}</span>
            <button
              type="button"
              data-testid="crm-lote-enviar"
              disabled={busyId === contacto.documentId}
              onClick={() => onEnviar(contacto.documentId)}
              className="px-3 py-1.5 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40 shrink-0"
            >
              WhatsApp
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
