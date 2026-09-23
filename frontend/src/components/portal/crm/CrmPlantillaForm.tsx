"use client";

import { FormEvent, useEffect, useState } from "react";
import PlantillaSlotEditor from "@/components/portal/PlantillaSlotEditor";
import { normalizePlantillaSlots, type PlantillaSlot } from "@/lib/plantilla-slots";

type Props = {
  mensaje: string;
  firma: string;
  slots?: PlantillaSlot[];
  onSave: (input: { firma: string; slots: PlantillaSlot[] }) => Promise<void>;
  busy: boolean;
};

export default function CrmPlantillaForm({ mensaje, firma, slots, onSave, busy }: Props) {
  const [items, setItems] = useState(() => normalizePlantillaSlots(slots, mensaje));
  const [active, setActive] = useState(0);
  const [sign, setSign] = useState(firma);

  useEffect(() => {
    setItems(normalizePlantillaSlots(slots, mensaje));
    setSign(firma);
  }, [mensaje, firma, slots]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ firma: sign, slots: items });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-testid="crm-plantilla-form">
      <PlantillaSlotEditor
        slots={items}
        activeIndex={active}
        onActiveIndex={setActive}
        onChangeSlot={(i, patch) =>
          setItems((prev) => prev.map((slot, idx) => (idx === i ? { ...slot, ...patch } : slot)))
        }
        testId="crm-plantilla-slots"
      />
      <input
        value={sign}
        onChange={(e) => setSign(e.target.value)}
        placeholder="Firma (compartida)"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10"
      >
        Guardar plantillas
      </button>
    </form>
  );
}
