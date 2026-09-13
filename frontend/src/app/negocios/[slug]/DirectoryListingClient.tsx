"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Negocio } from "@/types/strapi";
import { getStrapiUrl } from "@/lib/strapi";
import { isPremiumListingActive, neverBeenPremium } from "@/lib/search-match";
import { buildBusinessEditHref } from "@/lib/return-to";
import AdminListingActions from "@/components/home/AdminListingActions";
import styles from "./DirectoryListing.module.css";

export default function DirectoryListingClient({
  initialNegocio,
  slug,
}: {
  initialNegocio: Negocio;
  slug: string;
}) {
  const negocio = initialNegocio;
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(searchParams.get("auto_claim") === "1");
  const rubro = negocio.categoria?.nombre?.trim() || "Directorio";
  const isAdmin = session?.user?.role === "Admin";
  const canClaim =
    Boolean(negocio.reclamar_habilitado) &&
    !negocio.owner &&
    (!negocio.estado_reclamo || negocio.estado_reclamo === "ninguno");

  const submitClaim = async () => {
    if (!session || !negocio.documentId) return;
    setClaimErrorMessage(null);
    if (!claimFile) {
      setClaimErrorMessage("La documentación probatoria (DNI o Habilitación) es obligatoria.");
      return;
    }
    setIsClaiming(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ message: claimMessage }));
      formData.append("documentacion_reclamo", claimFile);
      const res = await fetch(`${getStrapiUrl()}/api/negocios/${negocio.documentId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.jwt}` },
        body: formData,
      });
      if (res.ok) {
        setClaimSuccessMessage("Tu solicitud de reclamo está pendiente de aprobación.");
        setShowClaimModal(false);
      } else {
        const payload = await res.json().catch(() => null);
        setClaimErrorMessage(payload?.error?.message || "Error al enviar el reclamo.");
      }
    } catch {
      setClaimErrorMessage("Error de conexión.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <main className={styles.page} data-testid="business-directory-listing">
      <article className={styles.panel}>
        <AdminListingActions
          jwt={session?.jwt ?? undefined}
          documentId={negocio.documentId}
          nombre={negocio.nombre}
          editHref={buildBusinessEditHref(slug)}
          showEdit={isAdmin}
          showDelete={Boolean(isAdmin && session?.jwt && !isPremiumListingActive(negocio))}
          showPurge={Boolean(isAdmin && session?.jwt && neverBeenPremium(negocio))}
          variant="inline"
          redirectOnDelete="/"
        />
        <p className={styles.rubro}>{rubro}</p>
        <h1 className={styles.nombre}>{negocio.nombre}</h1>
        <div className={styles.meta}>
          <Link
            href="/contacto"
            className={styles.subscribe}
            data-testid="directory-subscribe-cta"
          >
            ¿Querés suscribirte? Hacé click acá
          </Link>
        </div>
        {canClaim ? (
          <button
            data-testid="claim-profile-button"
            className={styles.claim}
            onClick={() => {
              if (!session) router.push(`/registro?claim=${slug}`);
              else setShowClaimModal(true);
            }}
          >
            Reclamar perfil
          </button>
        ) : null}
      </article>

      {showClaimModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          data-testid="claim-modal"
        >
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Reclamar Perfil</h3>
            <textarea
              data-testid="claim-message"
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              placeholder="Hola, soy el dueño..."
              className="w-full h-24 p-4 bg-slate-800 rounded-xl text-white mb-4 outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              id="claim-file-upload"
              data-testid="claim-file-upload"
              type="file"
              onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
              className="mb-4 text-white text-xs"
            />
            <div className="flex flex-col gap-3">
              <button
                data-testid="claim-submit"
                onClick={submitClaim}
                disabled={isClaiming}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all"
              >
                {isClaiming ? "Enviando..." : "Enviar Solicitud"}
              </button>
              <button
                onClick={() => setShowClaimModal(false)}
                className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
            {claimErrorMessage ? (
              <p data-testid="claim-error" className="mt-4 text-red-400 text-xs text-center">
                {claimErrorMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {claimSuccessMessage ? (
        <div
          data-testid="claim-success"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-6 py-4 text-sm font-bold text-emerald-300 shadow-2xl"
          role="status"
        >
          {claimSuccessMessage}
        </div>
      ) : null}
    </main>
  );
}
