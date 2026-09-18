"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  testId: string;
  children: ReactNode;
};

export default function CrmFold({ title, testId, children }: Props) {
  return (
    <details
      className="group rounded-2xl border border-white/10 bg-zinc-900/40"
      data-testid={testId}
    >
      <summary className="cursor-pointer select-none list-none px-4 py-2.5 flex items-center justify-between gap-3 text-white font-serif italic text-lg [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 not-italic font-sans group-open:hidden">
          Abrir
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 not-italic font-sans hidden group-open:inline">
          Cerrar
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
