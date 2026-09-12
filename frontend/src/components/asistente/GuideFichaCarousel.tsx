"use client";

import { useRef, useState } from "react";
import type { GuideFicha } from "@/lib/asistente/types";
import { GuideFichaCard } from "./GuideFichaCard";
import styles from "./GuideChat.module.css";

function cardStep(scroller: HTMLDivElement): number {
  const card = scroller.querySelector("[data-testid='guide-ficha-card']");
  if (!(card instanceof HTMLElement)) return scroller.clientWidth;
  const gap = Number.parseFloat(getComputedStyle(scroller).gap || "8") || 8;
  return card.getBoundingClientRect().width + gap;
}

export function GuideFichaCarousel({ hits }: { hits: GuideFicha[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  if (!hits.length) return null;

  function syncActive() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const step = cardStep(scroller);
    if (!step) return;
    setActive(Math.min(hits.length - 1, Math.max(0, Math.round(scroller.scrollLeft / step))));
  }

  function goTo(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const next = Math.min(hits.length - 1, Math.max(0, index));
    scroller.scrollTo({ left: next * cardStep(scroller), behavior: "smooth" });
    setActive(next);
  }

  return (
    <div className={styles.carousel} data-testid="guide-ficha-carousel">
      <div className={hits.length > 1 ? styles.carouselStage : undefined}>
        <div
          ref={scrollerRef}
          className={hits.length > 1 ? styles.cardsTrack : styles.cards}
          onScroll={syncActive}
          tabIndex={hits.length > 1 ? 0 : undefined}
          aria-label={hits.length > 1 ? "Fichas sugeridas, deslizá para ver más" : undefined}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") goTo(active + 1);
            if (event.key === "ArrowLeft") goTo(active - 1);
          }}
        >
          {hits.map((hit) => (
            <GuideFichaCard key={hit.objectID} hit={hit} />
          ))}
        </div>
        {hits.length > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.carouselNav} ${styles.carouselNavPrev}`}
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Ficha anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.carouselNav} ${styles.carouselNavNext}`}
              onClick={() => goTo(active + 1)}
              disabled={active === hits.length - 1}
              aria-label="Siguiente ficha"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {hits.length > 1 ? (
        <span className={styles.carouselHint} aria-live="polite">
          {active + 1} de {hits.length}
        </span>
      ) : null}
    </div>
  );
}
