"use client";

import Image from "next/image";
import { getStrapiMedia } from "@/lib/strapi";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { GuideCta, GuideFicha } from "@/lib/asistente/types";
import styles from "./GuideChat.module.css";

const COVER_TRANSFORM = "c_fill,g_auto,w_480,h_280,f_auto,q_auto";

function coverSrc(hit: GuideFicha): string | null {
  const media = getStrapiMedia(hit.coverUrl ?? null);
  if (!media) return null;
  return optimizeCloudinaryUrl(media, COVER_TRANSFORM) || media;
}

function instagramHref(username: string): string {
  return `https://www.instagram.com/${username}/`;
}

export function GuideFichaCard({ hit }: { hit: GuideFicha }) {
  const wa = hit.whatsapp
    ? buildWhatsappUrl(hit.whatsapp, `Hola ${hit.nombre}, te vi en San Rafael 360`)
    : null;
  const ig = hit.instagram_username ? instagramHref(hit.instagram_username) : null;
  const cover = coverSrc(hit);
  const meta = [hit.categoria, hit.zona].filter(Boolean).join(" · ");
  const rating =
    hit.rating && hit.reviewCount
      ? `${hit.rating.toFixed(1)} (${hit.reviewCount})`
      : null;

  return (
    <article className={styles.card} data-testid="guide-ficha-card">
      <a href={hit.url} className={styles.cardLink} aria-label={`Ver ficha de ${hit.nombre}`}>
        <span className={styles.cardCover}>
          {cover ? (
            <Image src={cover} alt="" fill sizes="(max-width: 768px) 90vw, 360px" className={styles.cardCoverImg} />
          ) : (
            <span className={styles.cardCoverEmpty} />
          )}
          {hit.categoria ? <span className={styles.cardBadge}>{hit.categoria}</span> : null}
        </span>
        <span className={styles.cardBody}>
          <span className={styles.cardNameRow}>
            <span className={styles.cardName}>
              {hit.nombre}
              {hit.is_premium ? <span className={styles.premium}>Premium</span> : null}
            </span>
            {rating ? <span className={styles.cardRating}>{rating}</span> : null}
          </span>
          {meta ? <span className={styles.cardMeta}>{meta}</span> : null}
        </span>
      </a>
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
