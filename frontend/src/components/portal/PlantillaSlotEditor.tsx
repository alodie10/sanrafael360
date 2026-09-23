"use client";

import type { PlantillaSlot } from "@/lib/plantilla-slots";

type Props = {
  slots: PlantillaSlot[];
  activeIndex: number;
  onActiveIndex: (index: number) => void;
  onChangeSlot: (index: number, patch: Partial<PlantillaSlot>) => void;
  testId?: string;
};

export default function PlantillaSlotEditor({
  slots,
  activeIndex,
  onActiveIndex,
  onChangeSlot,
  testId = "plantilla-slots",
}: Props) {
  const slot = slots[activeIndex] || slots[0];

  return (
    <div className="space-y-2" data-testid={testId}>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((item, i) => (
          <button
            key={i}
            type="button"
            data-testid={`${testId}-tab-${i}`}
            onClick={() => onActiveIndex(i)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
              i === activeIndex
                ? "bg-primary text-black border-primary"
                : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
            }`}
          >
            {i + 1}. {item.titulo || `Plantilla ${i + 1}`}
          </button>
        ))}
      </div>
      <input
        data-testid={`${testId}-titulo`}
        value={slot?.titulo || ""}
        onChange={(e) => onChangeSlot(activeIndex, { titulo: e.target.value })}
        placeholder="Nombre de esta plantilla"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <textarea
        data-testid={`${testId}-texto`}
        value={slot?.texto || ""}
        onChange={(e) => onChangeSlot(activeIndex, { texto: e.target.value })}
        placeholder="Texto del WhatsApp (sin saludo ni firma)"
        rows={6}
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
    </div>
  );
}
