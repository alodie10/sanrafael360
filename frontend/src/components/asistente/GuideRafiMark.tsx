"use client";

import styles from "./GuideChat.module.css";

export default function GuideRafiMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? styles.rafiMarkLg : size === "sm" ? styles.rafiMarkSm : "";

  return (
    <span className={`${styles.rafiMark} ${sizeClass}`} aria-hidden>
      <svg viewBox="0 0 40 32" fill="none">
        <path
          className={styles.rafiGlass}
          d="M11.2 4.4c5.6-1.2 12-1.2 17.6 0 2.4.5 4.2 2.6 4.6 5.2.8 6-3.2 10.8-10.2 13.4-1.4.5-2.8.8-3.2.9-.4-.1-1.8-.4-3.2-.9C9.8 20.4 5.8 15.6 6.6 9.6c.4-2.6 2.2-4.7 4.6-5.2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />

        <g className={styles.rafiFace}>
          <g className={styles.rafiGrapes}>
            <circle cx="10.6" cy="15.6" r="1.25" />
            <circle cx="12.7" cy="17.1" r="1.15" />
            <circle cx="9.5" cy="17.4" r="1" />
            <circle cx="29.4" cy="15.6" r="1.25" />
            <circle cx="27.3" cy="17.1" r="1.15" />
            <circle cx="30.5" cy="17.4" r="1" />
          </g>
          <g className={styles.rafiBlink}>
            <ellipse className={styles.rafiEyeWhite} cx="13.5" cy="11.6" rx="2.45" ry="2.55" />
            <ellipse className={styles.rafiEyeWhite} cx="26.5" cy="11.6" rx="2.45" ry="2.55" />
            <circle className={styles.rafiPupil} cx="13.65" cy="11.85" r="1.12" />
            <circle className={styles.rafiPupil} cx="26.65" cy="11.85" r="1.12" />
            <circle cx="14.3" cy="11.15" r="0.34" fill="#fff" />
            <circle cx="27.3" cy="11.15" r="0.34" fill="#fff" />
          </g>
          <path
            className={styles.rafiSmile}
            d="M15.2 16.8c1.8 1.35 7.8 1.35 9.6 0"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </g>

        <path d="M20 23.8v1.35" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
        <ellipse cx="20" cy="26.5" rx="6.4" ry="1.05" stroke="currentColor" strokeWidth="1.45" />
        <path d="M14.4 26.5h11.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    </span>
  );
}
