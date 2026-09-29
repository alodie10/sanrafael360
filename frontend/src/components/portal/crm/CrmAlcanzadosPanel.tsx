"use client";

import CrmContactadosList, { type CrmNotaItem } from "./CrmContactadosList";
import CrmLeadFilters from "./CrmLeadFilters";
import { filterAlcanzadosUi, idAlcanzado, type CrmAlcanzado, type CrmEstado, type CrmLeadFiltro } from "@/lib/crm";

type Props = {
  alcanzados: CrmAlcanzado[];
  filtro: CrmLeadFiltro;
  campanas: string[];
  selectedIds: string[];
  selectedLeadId: string | null;
  busy: boolean;
  onFiltro: (next: CrmLeadFiltro) => void;
  onToggle: (id: string) => void;
  onToggleVisibles: (ids: string[], on: boolean) => void;
  onLlevar: (visibles: CrmAlcanzado[]) => void;
  onSelect: (documentId: string | null) => void;
  onNota: (documentId: string, nota: string) => Promise<void>;
  onEstado: (documentId: string, estado: CrmEstado) => Promise<void>;
  onLoadNotas: (documentId: string) => Promise<CrmNotaItem[]>;
};

export default function CrmAlcanzadosPanel({
  alcanzados,
  filtro,
  campanas,
  selectedIds,
  selectedLeadId,
  busy,
  onFiltro,
  onToggle,
  onToggleVisibles,
  onLlevar,
  onSelect,
  onNota,
  onEstado,
  onLoadNotas,
}: Props) {
  const visibles = filterAlcanzadosUi(alcanzados, filtro);
  const visiblesIds = visibles.map(idAlcanzado);
  const marcados = visiblesIds.filter((id) => selectedIds.includes(id));
  const todos = visiblesIds.length > 0 && marcados.length === visiblesIds.length;

  return (
    <section className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-4">
      <h2 className="text-xl font-serif text-white italic">Contactos alcanzados</h2>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <CrmLeadFilters filtro={filtro} campanas={campanas} onChange={onFiltro} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <input
              type="checkbox"
              data-testid="crm-alcanzados-todos"
              checked={todos}
              disabled={!visiblesIds.length}
              onChange={() => onToggleVisibles(visiblesIds, !todos)}
              className="accent-primary"
            />
            Visibles
          </label>
          <button
            type="button"
            data-testid="crm-llevar-escritorio"
            disabled={!marcados.length}
            onClick={() => onLlevar(visibles)}
            className="px-3 py-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl disabled:opacity-40"
          >
            Llevar al escritorio ({marcados.length})
          </button>
        </div>
      </div>
      <CrmContactadosList
        contactos={visibles}
        selectedIds={selectedIds}
        onToggle={onToggle}
        selectedId={selectedLeadId}
        onSelect={onSelect}
        onNota={onNota}
        onEstado={onEstado}
        onLoadNotas={onLoadNotas}
        busy={busy}
      />
    </section>
  );
}
