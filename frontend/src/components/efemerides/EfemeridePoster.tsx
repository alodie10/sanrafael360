import type { CSSProperties } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { POSTER_HERO_ID, POSTER_LIGHTBOX_ID } from "./efemeridePosterIds";
import EfemeridePosterEscape from "./EfemeridePosterEscape";
import styles from "./EfemerideHero.module.css";

type PosterProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
};

export default function EfemeridePoster({ src, alt, width, height, sizes }: PosterProps) {
  const fullSrc = optimizeCloudinaryUrl(src, "c_limit,w_2000,q_auto,f_auto");

  return (
    <figure
      className={styles.poster}
      style={{ "--poster-w": String(width), "--poster-h": String(height) } as CSSProperties}
      data-testid="efemeride-poster"
    >
      <Image src={fullSrc} alt="" fill sizes={sizes} className={styles.posterImg} priority />
      <span className={styles.posterHint} aria-hidden>
        <Expand className="w-4 h-4" />
      </span>
      <a
        href={`#${POSTER_LIGHTBOX_ID}`}
        className={styles.posterOpen}
        aria-label={`Ver ${alt} a pantalla completa`}
        data-testid="efemeride-poster-open"
      />
    </figure>
  );
}

export function EfemeridePosterLightbox({ src, alt }: { src: string; alt: string }) {
  const fullSrc = optimizeCloudinaryUrl(src, "c_limit,w_2000,q_auto,f_auto");

  return (
    <>
      <div
        id={POSTER_LIGHTBOX_ID}
        className={styles.lightbox}
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        data-testid="efemeride-poster-lightbox"
      >
        <a
          href={`#${POSTER_HERO_ID}`}
          className={styles.lightboxBackdrop}
          aria-label="Cerrar afiche"
        />
        <img src={fullSrc} alt={alt} className={styles.lightboxImg} />
        <a href={`#${POSTER_HERO_ID}`} className={styles.lightboxClose} aria-label="Cerrar afiche">
          <X className="w-6 h-6" />
        </a>
      </div>
      <EfemeridePosterEscape />
    </>
  );
}
