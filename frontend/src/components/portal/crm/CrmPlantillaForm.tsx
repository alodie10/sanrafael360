"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import PlantillaSlotEditor from "@/components/portal/PlantillaSlotEditor";
import type { CrmPieza } from "@/lib/crm";
import { normalizePlantillaSlots, type PlantillaSlot } from "@/lib/plantilla-slots";

function plantillaKey(firma: string, slots: PlantillaSlot[]) {
  return JSON.stringify({ firma, slots });
}

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const itemsRef = useRef(items);
  const signRef = useRef(sign);
  const appliedKey = useRef<string | null>(null);
  itemsRef.current = items;
  signRef.current = sign;

  useEffect(() => {
    const nextItems = normalizePlantillaSlots(slots, mensaje);
    const nextKey = plantillaKey(firma, nextItems);
    const localKey = plantillaKey(signRef.current, itemsRef.current);
    if (appliedKey.current !== null && localKey !== appliedKey.current) return;
    appliedKey.current = nextKey;
    setItems(nextItems);
    setSign(firma);
  }, [mensaje, firma, slots]);

  function editSign(value: string) {
    setSaved(false);
    setSign(value);
  }

  function editSlot(index: number, patch: Partial<PlantillaSlot>) {
    setSaved(false);
    setItems((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, ...patch } : slot)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ firma: sign, slots: items });
      appliedKey.current = plantillaKey(sign, items);
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-testid="crm-plantilla-form">
      <PlantillaSlotEditor
        slots={items}
        activeIndex={active}
        onActiveIndex={setActive}
        onChangeSlot={editSlot}
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
        onChange={(e) => editSign(e.target.value)}
        placeholder="Firma (compartida)"
        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm"
      />
      {saved && (
        <p
          role="status"
          data-testid="crm-plantilla-saved"
          className="rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3 text-sm font-bold text-primary"
        >
          Plantilla guardada
        </p>
      )}
      <button
        type="submit"
        disabled={busy || saving}
        data-testid="crm-plantilla-save"
        className={`px-6 py-3 font-black uppercase tracking-widest text-[10px] rounded-2xl border disabled:opacity-50 ${
          saved
            ? "bg-primary text-black border-primary"
            : "bg-white/10 text-white border-white/10"
        }`}
      >
        {saving ? "Guardando…" : saved ? "Guardado" : "Guardar plantillas"}
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
