"use client";

import { FormEvent, useState } from "react";

type Props = {
  onCreate: (input: {
    nombre: string;
    telefono: string;
    instagram: string;
    nota: string;
  }) => Promise<void>;
  busy: boolean;
};

export default function CrmManualForm({ onCreate, busy }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [instagram, setInstagram] = useState("");
  const [nota, setNota] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onCreate({ nombre, telefono, instagram, nota });
    setNombre("");
    setTelefono("");
    setInstagram("");
    setNota("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
      data-testid="crm-manual-form"
    >
      <input
        data-testid="crm-manual-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del comercio"
        required
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <input
        data-testid="crm-manual-telefono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono WhatsApp"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <input
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder="Instagram (opcional)"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Nota"
        rows={2}
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        data-testid="crm-manual-submit"
        className="px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-2xl disabled:opacity-40"
      >
        Cargar contacto
      </button>
    </form>
  );
}
