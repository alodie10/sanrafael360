import { ExternalLink, Instagram } from "lucide-react";
import type { ParticipanteExterno } from "@/types/strapi";
import styles from "./FeriaParticipantesList.module.css";

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

function isInstagram(href: string): boolean {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return host === "instagram.com" || host.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function ParticipantCard({ item, index }: { item: ParticipanteExterno; index: number }) {
  const href = safeHttpUrl(item.url);
  const instagram = href ? isInstagram(href) : false;
  const inner = (
    <>
      <span className={styles.avatar} aria-hidden>
        {initials(item.nombre)}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{item.nombre}</span>
        {href && (
          <span className={styles.cta}>
            {instagram ? <Instagram className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {instagram ? "Instagram" : "Visitar"}
          </span>
        )}
      </span>
    </>
  );

  if (!href) {
    return (
      <li>
        <div className={styles.card}>{inner}</div>
      </li>
    );
  }

  return (
    <li>
      <a
        className={styles.card}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`feria-participante-${index}`}
      >
        {inner}
      </a>
    </li>
  );
}

export default function FeriaParticipantesList({
  items,
  variant = "grid",
}: {
  items: ParticipanteExterno[];
  variant?: "grid" | "rail";
}) {
  if (items.length === 0) {
    return (
      <div className={styles.empty} data-variant={variant}>
        <div className={styles.emptyIcon}>🧺</div>
        <h3 className={styles.emptyTitle}>Todavía no hay participantes</h3>
        <p className={styles.emptyLead}>
          Esta feria está activa, pero aún no se cargó el listado de emprendimientos.
        </p>
      </div>
    );
  }

  return (
    <ul
      className={variant === "rail" ? styles.rail : styles.list}
      data-testid="feria-participantes-list"
      data-variant={variant}
    >
      {items.map((item, index) => (
        <ParticipantCard key={`${item.nombre}-${index}`} item={item} index={index} />
      ))}
    </ul>
  );
}
