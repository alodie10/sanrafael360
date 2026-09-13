"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteNegocio, adminPurgeNegocioMedia } from "@/lib/admin-listing";
import styles from "./AdminListingActions.module.css";

export default function AdminListingActions({
  jwt,
  documentId,
  nombre,
  editHref,
  showEdit,
  showDelete,
  showPurge,
  variant = "card",
  redirectOnDelete,
  onDeleted,
}: {
  jwt?: string;
  documentId: string;
  nombre: string;
  editHref?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showPurge?: boolean;
  variant?: "card" | "inline";
  redirectOnDelete?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"delete" | "purge" | null>(null);
  if (!showEdit && !showDelete && !showPurge) return null;

  const run = async (kind: "delete" | "purge", action: () => Promise<void>) => {
    if (!jwt || busy) return;
    setBusy(kind);
    try {
      await action();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setBusy(null);
    }
  };

  const gear = showEdit && editHref ? (
    <Link href={editHref} className={styles.iconBtn} title="Gestionar negocio">
      <Settings className="w-4 h-4" />
    </Link>
  ) : null;

  const buttons = (
    <>
      {showDelete ? (
        <button
          type="button"
          className={styles.deleteBtn}
          data-testid="admin-delete-negocio"
          disabled={Boolean(busy)}
          onClick={() => {
            if (!confirm(`¿Borrar "${nombre}" del directorio? Esta acción no se puede deshacer.`)) return;
            void run("delete", async () => {
              await adminDeleteNegocio(jwt as string, documentId);
              toast.success("Negocio borrado.");
              onDeleted?.();
              if (redirectOnDelete) router.push(redirectOnDelete);
              else router.refresh();
            });
          }}
        >
          {busy === "delete" ? "Borrando…" : "Borrar Negocio"}
        </button>
      ) : null}
      {showPurge ? (
        <button
          type="button"
          className={styles.purgeBtn}
          data-testid="admin-purge-media"
          disabled={Boolean(busy)}
          onClick={() => {
            if (!confirm(`¿Borrar de Cloudinary las fotos de "${nombre}"? El listado se queda, sin imágenes.`)) return;
            void run("purge", async () => {
              const payload = await adminPurgeNegocioMedia(jwt as string, documentId);
              const removed = payload.data?.removed ?? 0;
              toast.success(removed ? `Se borraron ${removed} archivo(s).` : "No había fotos en Cloudinary.");
            });
          }}
        >
          {busy === "purge" ? "Limpiando…" : "Limpiar fotos"}
        </button>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return (
      <div className={styles.inline}>
        {gear}
        {buttons}
      </div>
    );
  }

  return (
    <>
      {gear ? <div className={styles.overlay}>{gear}</div> : null}
      {showDelete || showPurge ? <div className={styles.footer}>{buttons}</div> : null}
    </>
  );
}
