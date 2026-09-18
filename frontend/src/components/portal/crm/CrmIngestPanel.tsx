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
    <div className="space-y-3" data-testid="crm-ingest-panel">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="crm-prompt-copy"
            onClick={copyPrompt}
            className="px-4 py-2 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10"
          >
            {copied ? "Prompt copiado" : "Copiar prompt para la IA"}
          </button>
          <button
            type="submit"
            disabled={busy}
            data-testid="crm-ingest-submit"
            className="px-4 py-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
          >
            Encolar lista
          </button>
        </div>
        <textarea
          data-testid="crm-ingest-textarea"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='Pegá el JSON: [{ "nombre": "...", "telefono": "" }]'
          rows={5}
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono min-h-[7.5rem]"
        />
      </form>
    </div>
  );
}
