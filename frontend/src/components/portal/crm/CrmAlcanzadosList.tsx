"use client";

export type CrmAlcanzado = {
  documentId: string;
  enviadoAt: string;
  nombre: string;
  telefono: string;
  categoriaNombre: string;
  negocioSlug: string;
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default function CrmAlcanzadosList({ rows }: { rows: CrmAlcanzado[] }) {
  if (!rows.length) {
    return (
      <p className="text-zinc-500 text-sm italic" data-testid="crm-alcanzados-empty">
        Todavía no hay contactos alcanzados. Quedan acá cuando abrís WhatsApp.
      </p>
    );
  }

  return (
    <ul className="space-y-2" data-testid="crm-alcanzados">
      {rows.map((row) => (
        <li
          key={row.documentId}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 md:gap-6 items-center rounded-2xl border border-white/5 bg-zinc-950/40 px-5 py-4"
        >
          <span className="text-white font-medium">{row.nombre || "Contacto"}</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            {row.categoriaNombre || "Sin rubro"}
          </span>
          <span className="text-xs text-zinc-400">{formatFecha(row.enviadoAt)}</span>
        </li>
      ))}
    </ul>
  );
}
