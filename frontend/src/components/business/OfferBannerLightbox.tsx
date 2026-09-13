"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import styles from "./OfferBannerLightbox.module.css";

type Props = {
  images: string[];
  startIndex?: number;
  alt: string;
  fichaHref?: string;
  fichaLabel?: string;
  onClose: () => void;
};

export default function OfferBannerLightbox({
  images,
  startIndex = 0,
  alt,
  fichaHref,
  fichaLabel,
  onClose,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(startIndex);
  const src = images[index] || images[0];
  const fullSrc = optimizeCloudinaryUrl(src, "c_limit,w_2000,q_auto,f_auto");
  const hasMany = images.length > 1;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((curr) => (curr + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((curr) => (curr - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, onClose]);

  if (!src) return null;

  const goToFicha = () => {
    if (fichaHref) router.push(fichaHref);
    else onClose();
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      data-testid="oferta-banner-lightbox"
      onClick={onClose}
    >
      <button type="button" className={styles.close} onClick={(event) => { event.stopPropagation(); onClose(); }} aria-label="Cerrar banner">
        <X className="w-6 h-6" />
      </button>
      <div className={styles.stage} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={goToFicha}
          aria-label={fichaHref ? `Ver ficha: ${alt}` : alt}
        >
          <img src={fullSrc} alt={alt} className={styles.img} />
        </button>
        {hasMany && (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.navPrev}`}
              aria-label="Banner anterior"
              onClick={() => setIndex((curr) => (curr - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.navNext}`}
              aria-label="Banner siguiente"
              onClick={() => setIndex((curr) => (curr + 1) % images.length)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      {hasMany && (
        <div className={styles.dots} onClick={(event) => event.stopPropagation()}>
          {images.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ""}`}
              aria-label={`Banner ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
      )}
      {fichaHref ? (
        <button
          type="button"
          className={styles.cta}
          onClick={(event) => {
            event.stopPropagation();
            goToFicha();
          }}
          data-testid="oferta-banner-ficha"
        >
          {fichaLabel || "Ver ficha"}
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <p className={styles.hint}>Tocá fuera o Escape para cerrar</p>
      )}
    </div>
  );
}
