"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Negocio } from "@/types/strapi";
import { buildBusinessEditHref } from "@/lib/return-to";
import { isPremiumListingActive, neverBeenPremium } from "@/lib/search-match";
import AdminListingActions from "./AdminListingActions";
import styles from "./DirectoryListingCard.module.css";

export default function DirectoryListingCard({
  negocio,
  onDeleted,
}: {
  negocio: Negocio;
  onDeleted?: (documentId: string) => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQs = searchParams.toString();
  const businessSlug = negocio.slug || negocio.documentId;
  const sessionUserId = String(session?.user?.id || "");
  const ownerId = String(negocio.owner?.id || negocio.owner?.documentId || "");
  const isAdmin = session?.user?.role === "Admin";
  const isOwner = Boolean(sessionUserId && ownerId && sessionUserId === ownerId);
  const rubro = negocio.categoria?.nombre?.trim() || "Directorio";
  const editHref = buildBusinessEditHref(
    businessSlug,
    `${pathname}${searchQs ? `?${searchQs}` : ""}`
  );

  return (
    <article className={styles.card} data-testid="directory-listing-card">
      <AdminListingActions
        jwt={session?.jwt ?? undefined}
        documentId={negocio.documentId}
        nombre={negocio.nombre}
        editHref={editHref}
        showEdit={isAdmin || isOwner}
        showDelete={Boolean(isAdmin && session?.jwt && !isPremiumListingActive(negocio))}
        showPurge={Boolean(isAdmin && session?.jwt && neverBeenPremium(negocio))}
        onDeleted={() => onDeleted?.(negocio.documentId)}
      />
      <p className={styles.rubro}>{rubro}</p>
      <h3 className={styles.nombre}>{negocio.nombre}</h3>
      <Link href="/contacto" className={styles.subscribe} data-testid="directory-subscribe-cta">
        ¿Querés suscribirte?
      </Link>
    </article>
  );
}
