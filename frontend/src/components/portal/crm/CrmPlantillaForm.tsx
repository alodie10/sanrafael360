"use client";

import { FormEvent, useEffect, useState } from "react";
import PlantillaSlotEditor from "@/components/portal/PlantillaSlotEditor";
import type { CrmPieza } from "@/lib/crm";
import { normalizePlantillaSlots, type PlantillaSlot } from "@/lib/plantilla-slots";

type Props = {
  mensaje: string;
  firma: string;
  slots?: PlantillaSlot[];
  piezas?: CrmPieza[];
  onSave: (input: { firma: string; slots: PlantillaSlot[] }) => Promise<void>;
  onUploadPieza: (slotIndex: number, file: File) => Promise<void>;
  onQuitarPieza: (slotIndex: number) => Promise<void>;
  busy: boolean;
};

export default function CrmPlantillaForm({
  mensaje,
  firma,
  slots,
  piezas,
  onSave,
  onUploadPieza,
  onQuitarPieza,
  busy,
}: Props) {
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
      <CrmPiezaSlot
        pieza={(piezas || []).find((item) => item.slotIndex === active)}
        busy={busy}
        onUpload={(file) => onUploadPieza(active, file)}
        onQuitar={() => onQuitarPieza(active)}
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

function CrmPiezaSlot({
  pieza,
  busy,
  onUpload,
  onQuitar,
}: {
  pieza?: CrmPieza;
  busy: boolean;
  onUpload: (file: File) => Promise<void>;
  onQuitar: () => Promise<void>;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3" data-testid="crm-pieza">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Banner del mensaje
      </p>
      {pieza ? (
        <img
          src={pieza.imageUrl}
          alt={pieza.titulo}
          className="max-h-48 w-full rounded-xl object-contain bg-black"
          data-testid="crm-pieza-preview"
        />
      ) : (
        <p className="text-xs text-zinc-500">
          Subí un JPG, PNG o WEBP. El link público se agrega al WhatsApp y ahí se ve la imagen.
        </p>
      )}
      {pieza ? (
        <p className="break-all text-[11px] text-zinc-400" data-testid="crm-pieza-url">
          {pieza.pageUrl}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
          {pieza ? "Cambiar imagen" : "Subir imagen"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            data-testid="crm-pieza-file"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onUpload(file);
            }}
          />
        </label>
        {pieza ? (
          <button
            type="button"
            data-testid="crm-pieza-quitar"
            disabled={busy}
            onClick={() => void onQuitar()}
            className="rounded-xl border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 disabled:opacity-40"
          >
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}
