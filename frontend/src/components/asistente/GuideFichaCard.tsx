"use client";

import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { GuideCta, GuideFicha } from "@/lib/asistente/types";
import styles from "./GuideChat.module.css";

function instagramHref(username: string): string {
  return `https://www.instagram.com/${username}/`;
}

export function GuideFichaCard({ hit }: { hit: GuideFicha }) {
  const wa = hit.whatsapp
    ? buildWhatsappUrl(hit.whatsapp, `Hola ${hit.nombre}, te vi en San Rafael 360`)
    : null;
  const ig = hit.instagram_username ? instagramHref(hit.instagram_username) : null;
  const meta = [hit.categoria, hit.zona].filter(Boolean).join(" · ");

  return (
    <article className={styles.card} data-testid="guide-ficha-card">
      <a href={hit.url} className={styles.cardName}>
        {hit.nombre}
        {hit.is_premium ? <span className={styles.premium}>Premium</span> : null}
      </a>
      {meta ? <p className={styles.cardMeta}>{meta}</p> : null}
      <div className={styles.ctas}>
        <a className={styles.ctaGhost} href={hit.url}>
          Ver ficha
        </a>
        {wa ? (
          <a className={styles.cta} href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        ) : null}
        {ig ? (
          <a className={styles.ctaGhost} href={ig} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function GuideAnunciarCta({ cta }: { cta: GuideCta }) {
  return (
    <a className={styles.cta} href={cta.href} data-testid="guide-cta-anunciar">
      {cta.label}
    </a>
  );
}
