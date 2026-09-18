"use client";

import { FormEvent, useState } from "react";
import { copyTextToClipboard } from "@/lib/prospeccion";

type Props = {
  prompt: string;
  onIngest: (payload: string) => Promise<void>;
  busy: boolean;
};

export default function CrmIngestPanel({ prompt, onIngest, busy }: Props) {
  const [payload, setPayload] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    const ok = await copyTextToClipboard(prompt);
    setCopied(ok);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onIngest(payload);
    setPayload("");
  }

  return (
    <div className="space-y-4" data-testid="crm-ingest-panel">
      <button
        type="button"
        data-testid="crm-prompt-copy"
        onClick={copyPrompt}
        className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10"
      >
        {copied ? "Prompt copiado" : "Copiar prompt para la IA"}
      </button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          data-testid="crm-ingest-textarea"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='Pegá el JSON: [{ "nombre": "...", "telefono": "" }]'
          rows={8}
          className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm font-mono"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="crm-ingest-submit"
          className="px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-2xl disabled:opacity-40"
        >
          Encolar lista
        </button>
      </form>
    </div>
  );
}
