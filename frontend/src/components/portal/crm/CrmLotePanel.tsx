"use client";

import type { CrmContacto } from "@/lib/crm";

type CrmCanal = "whatsapp" | "email";

type Props = {
  contactos: CrmContacto[];
  onEnviar: (documentId: string, canal: CrmCanal) => void;
  busyId: string | null;
  cupoLleno?: boolean;
};

export default function CrmLotePanel({
  contactos,
  onEnviar,
  busyId,
  cupoLleno = false,
}: Props) {
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
            <span className="text-white text-sm truncate">
              {contacto.nombre || "Contacto"}
              {contacto.email ? <span className="block text-zinc-500 text-xs">{contacto.email}</span> : null}
            </span>
            <span className="flex gap-2 shrink-0">
              <button
                type="button"
                data-testid="crm-lote-enviar"
                disabled={busyId === contacto.documentId || cupoLleno}
                onClick={() => onEnviar(contacto.documentId, "whatsapp")}
                className="px-3 py-1.5 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
              >
                WhatsApp
              </button>
              <button
                type="button"
                data-testid="crm-lote-enviar-mail"
                disabled={busyId === contacto.documentId || !contacto.email}
                onClick={() => onEnviar(contacto.documentId, "email")}
                className="px-3 py-1.5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
              >
                Mail
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
