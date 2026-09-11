import { ExternalLink } from "lucide-react";
import type { ParticipanteExterno } from "@/types/strapi";

function safeHttpUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export default function FeriaParticipantesList({
  items,
}: {
  items: ParticipanteExterno[];
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-24 px-6 bg-slate-900/20 rounded-[3rem] border border-white/5">
        <div className="text-5xl mb-6 opacity-30">🧺</div>
        <h3 className="text-xl font-bold text-white mb-2">Todavía no hay participantes</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          Esta feria está activa, pero aún no se cargó el listado de emprendimientos.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="rounded-[2rem] border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5"
      data-testid="feria-participantes-list"
    >
      {items.map((item, index) => {
        const href = safeHttpUrl(item.url);
        return (
          <li
            key={`${item.nombre}-${index}`}
            className="flex items-center justify-between gap-4 px-6 py-4 md:px-8 md:py-5"
          >
            <span className="flex items-start gap-3 text-white">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-base md:text-lg font-medium leading-snug">{item.nombre}</span>
            </span>
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline shrink-0"
              >
                Visitar <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
