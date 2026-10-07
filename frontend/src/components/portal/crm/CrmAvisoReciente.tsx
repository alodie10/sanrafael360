"use client";

import { formatCrmFecha } from "@/lib/crm";

type Props = {
  campana: string;
  enviadoAt: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function CrmAvisoReciente({ campana, enviadoAt, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70" data-testid="crm-aviso-reciente">
      <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-zinc-950 space-y-4">
        <h3 className="text-xl font-serif text-white italic">Contacto reciente</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">
          El último envío fue el {formatCrmFecha(enviadoAt)} ({campana}). Pasó menos de un mes.
          ¿Enviar igual?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            data-testid="crm-aviso-cancelar"
            onClick={onCancel}
            className="px-4 py-2 border border-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="crm-aviso-confirmar"
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl"
          >
            Enviar igual
          </button>
        </div>
      </div>
    </div>
  );
}
