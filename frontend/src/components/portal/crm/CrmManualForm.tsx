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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next = {
      nombre: String(data.get("crm-lead-nombre") || nombre).trim(),
      telefono: String(data.get("crm-lead-telefono") || telefono).trim(),
      instagram: String(data.get("crm-lead-instagram") || instagram).trim(),
      nota: String(data.get("crm-lead-nota") || nota).trim(),
    };
    if (!next.nombre) return;
    await onCreate(next);
    form.reset();
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
      autoComplete="off"
    >
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Nombre del contacto
        <input
          data-testid="crm-manual-nombre"
          name="crm-lead-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Ana Pérez"
          required
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
        />
      </label>
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Teléfono WhatsApp
        <input
          data-testid="crm-manual-telefono"
          name="crm-lead-telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: 2615550000"
          autoComplete="off"
          inputMode="tel"
          className="mt-1 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
        />
      </label>
      <input
        name="crm-lead-instagram"
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder="Instagram (opcional)"
        autoComplete="off"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <textarea
        name="crm-lead-nota"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Comentario (opcional)"
        rows={2}
        autoComplete="off"
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
