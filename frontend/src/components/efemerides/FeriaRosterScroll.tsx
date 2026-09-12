"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./EfemerideHero.module.css";

export default function FeriaRosterScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const canScroll = el.scrollHeight > el.clientHeight + 16;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
      setShowHint(canScroll && !atEnd);
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.rosterListWrap}>
      <div ref={ref} className={styles.rosterList}>
        {children}
      </div>
      {showHint && (
        <p className={styles.rosterMore}>
          <ChevronDown className="w-4 h-4" />
          Más emprendimientos
        </p>
      )}
    </div>
  );
}
