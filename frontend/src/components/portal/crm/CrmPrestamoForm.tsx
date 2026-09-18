"use client";

import { FormEvent, useState } from "react";

type Props = {
  onPrestar: (input: { nombre: string; owner_email: string; slug?: string }) => Promise<void>;
  busy: boolean;
};

export default function CrmPrestamoForm({ onPrestar, busy }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onPrestar({
      nombre,
      owner_email: email,
      slug: slug.trim() || undefined,
    });
    setNombre("");
    setEmail("");
    setSlug("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="crm-prestamo-form"
    >
      <p className="text-zinc-400 text-sm">
        El tercero entra a <span className="text-white">/portal/crm</span> con su usuario.
        Agenda propia: sin Places ni las 700 fichas.
      </p>
      <input
        data-testid="crm-prestamo-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del comercio"
        required
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <input
        data-testid="crm-prestamo-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email del tercero"
        required
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <input
        data-testid="crm-prestamo-slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Slug (opcional)"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        data-testid="crm-prestamo-submit"
        className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 disabled:opacity-40"
      >
        Prestar CRM
      </button>
    </form>
  );
}
