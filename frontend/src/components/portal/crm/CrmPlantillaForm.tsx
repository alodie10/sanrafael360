"use client";

import { FormEvent, useEffect, useState } from "react";

type Props = {
  mensaje: string;
  firma: string;
  onSave: (input: { mensaje: string; firma: string }) => Promise<void>;
  busy: boolean;
};

export default function CrmPlantillaForm({ mensaje, firma, onSave, busy }: Props) {
  const [body, setBody] = useState(mensaje);
  const [sign, setSign] = useState(firma);

  useEffect(() => {
    setBody(mensaje);
    setSign(firma);
  }, [mensaje, firma]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ mensaje: body, firma: sign });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-testid="crm-plantilla-form">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <input
        value={sign}
        onChange={(e) => setSign(e.target.value)}
        placeholder="Firma"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10"
      >
        Guardar mensaje
      </button>
    </form>
  );
}
