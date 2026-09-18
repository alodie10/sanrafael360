"use client";

import { CRM_ESTADOS, type CrmLeadFiltro } from "@/lib/crm";

type Props = {
  filtro: CrmLeadFiltro;
  onChange: (next: CrmLeadFiltro) => void;
};

export default function CrmLeadFilters({ filtro, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="crm-lead-filters">
      <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Estado
        <select
          data-testid="crm-filtro-estado"
          value={filtro.estado}
          onChange={(e) => onChange({ ...filtro, estado: e.target.value as CrmLeadFiltro["estado"] })}
          className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 font-medium tracking-normal normal-case"
        >
          <option value="">Todos</option>
          {CRM_ESTADOS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Desde
        <input
          type="date"
          data-testid="crm-filtro-desde"
          value={filtro.desde}
          onChange={(e) => onChange({ ...filtro, desde: e.target.value })}
          className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Hasta
        <input
          type="date"
          data-testid="crm-filtro-hasta"
          value={filtro.hasta}
          onChange={(e) => onChange({ ...filtro, hasta: e.target.value })}
          className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2"
        />
      </label>
    </div>
  );
}
