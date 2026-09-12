"use client";

import { useEffect } from "react";
import { POSTER_HERO_ID, POSTER_LIGHTBOX_ID } from "./efemeridePosterIds";

export default function EfemeridePosterEscape() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (window.location.hash !== `#${POSTER_LIGHTBOX_ID}`) return;
      window.location.hash = POSTER_HERO_ID;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
