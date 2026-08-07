'use client';

import { Calendar } from 'lucide-react';
import type { PeriodPreset } from '@/lib/performance-period';
import { PERIOD_PRESET_LABELS } from '@/lib/performance-period';
import { cn } from '@/lib/utils';

type Props = {
  preset: PeriodPreset;
  startDate: string;
  endDate: string;
  onPreset: (preset: Exclude<PeriodPreset, 'custom'>) => void;
  onCustom: () => void;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
  onResetToDefault?: () => void;
};

function DateField({
  label,
  value,
  onChange,
  max,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: string;
  min?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[9.5rem]">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      <span className="relative inline-flex items-center">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'relative w-full bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-10 py-2.5',
            'text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50',
            'color-scheme-dark-date'
          )}
        />
        <Calendar
          className="pointer-events-none absolute right-3 w-4 h-4 text-zinc-300"
          aria-hidden
        />
      </span>
    </label>
  );
}

export default function PerformancePeriodFilter({
  preset,
  startDate,
  endDate,
  onPreset,
  onCustom,
  onStartDate,
  onEndDate,
  onResetToDefault,
}: Props) {
  return (
    <div
      className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col gap-5"
      data-testid="performance-period-filter"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">Período</h2>
          <p className="text-sm text-zinc-400">
            Aplica al gráfico, KPIs y desglose por negocio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-black/30 rounded-2xl border border-white/5 self-start">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPreset(p)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                preset === p
                  ? 'bg-primary text-black shadow-lg shadow-primary/20'
                  : 'text-zinc-500 hover:text-white'
              )}
              data-testid={`performance-preset-${p}`}
            >
              {PERIOD_PRESET_LABELS[p]}
            </button>
          ))}
          <button
            type="button"
            onClick={onCustom}
            className={cn(
              'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              preset === 'custom'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-zinc-500 hover:text-white'
            )}
            data-testid="performance-preset-custom"
          >
            Personalizado
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <DateField label="Desde" value={startDate} max={endDate} onChange={onStartDate} />
        <DateField label="Hasta" value={endDate} min={startDate} onChange={onEndDate} />
        {preset === 'custom' && onResetToDefault ? (
          <button
            type="button"
            onClick={onResetToDefault}
            className="text-sm text-primary hover:text-white transition-colors pb-2.5 self-start sm:self-auto"
          >
            Volver a 30 días
          </button>
        ) : null}
      </div>
    </div>
  );
}
