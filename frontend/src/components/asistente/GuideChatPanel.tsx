"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { trackGuideEvent } from "@/lib/asistente/analytics";
import { postGuideTurn } from "@/lib/asistente/client";
import type { GuideCta, GuideFicha, GuideHistoryItem, GuideMissTrace, GuideResponseType } from "@/lib/asistente/types";
import { GuideAnunciarCta } from "./GuideFichaCard";
import { GuideFichaCarousel } from "./GuideFichaCarousel";
import GuideRafiMark from "./GuideRafiMark";
import styles from "./GuideChat.module.css";

type Line = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hits?: GuideFicha[];
  cta?: GuideCta;
  type?: GuideResponseType;
};

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function trackResult(type: GuideResponseType, hits: GuideFicha[], miss?: GuideMissTrace) {
  if (type === "results") {
    trackGuideEvent("guide_results_shown", {
      n: hits.length,
      premium_n: hits.filter((hit) => hit.is_premium).length,
    });
    return;
  }
  if (type === "empty") {
    trackGuideEvent("guide_no_results", {
      raw_query: miss?.raw_query,
      expanded_queries: miss?.expanded_queries,
      categories_tried: miss?.categories_tried,
    });
  }
  if (type === "anunciar") trackGuideEvent("guide_cta_anunciar");
  if (type === "error") trackGuideEvent("guide_error");
}

export default function GuideChatPanel({
  intro,
  variant,
  onClose,
}: {
  intro: string;
  variant: "widget" | "page";
  onClose?: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    { id: "intro", role: "assistant", content: intro },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "page") trackGuideEvent("guide_chat_opened");
  }, [variant]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    const frame = window.requestAnimationFrame(() => {
      if (loading || !latestTurnRef.current) {
        thread.scrollTo({ top: thread.scrollHeight, behavior });
        return;
      }
      thread.scrollTo({ top: Math.max(0, latestTurnRef.current.offsetTop - 6), behavior });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lines, loading]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    setDraft("");
    setLoading(true);
    trackGuideEvent("guide_query");
    setLines((prev) => [...prev, { id: nextId(), role: "user", content: message }]);

    const history: GuideHistoryItem[] = lines
      .filter((line) => line.id !== "intro")
      .slice(-12)
      .map((line) => ({ role: line.role, content: line.content }));

    const result = await postGuideTurn({ message, history, excludeIds: shownIds });
    trackResult(result.type, result.hits, result.miss);

    if (result.type === "reset") {
      setShownIds([]);
      setLines([{ id: "intro", role: "assistant", content: result.text || intro }]);
      setLoading(false);
      return;
    }

    if (result.hits.length) {
      setShownIds((prev) => [...prev, ...result.hits.map((hit) => hit.objectID)]);
    }

    setLines((prev) => [
      ...prev,
      {
        id: nextId(),
        role: "assistant",
        content: result.text,
        hits: result.hits,
        cta: result.cta,
        type: result.type,
      },
    ]);
    setLoading(false);
  }

  return (
    <section
      className={variant === "page" ? styles.page : styles.panelWrap}
      data-testid="guide-chat-panel"
    >
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <GuideRafiMark />
          <div className={styles.headerCopy}>
            <h2 className={styles.headerTitle}>Rafi</h2>
            <span className={styles.headerKicker}>Guía SR360</span>
          </div>
        </div>
        {onClose ? (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar chat">
            ✕
          </button>
        ) : null}
      </header>
      <div className={`${styles.thread} no-scrollbar`} ref={threadRef}>
        {lines.map((line, index) => (
          <div
            key={line.id}
            className={styles.turn}
            ref={index === lines.length - 1 ? latestTurnRef : undefined}
          >
            <p className={line.role === "user" ? styles.bubbleUser : styles.bubbleAssist}>
              {line.content}
            </p>
            {line.hits?.length ? <GuideFichaCarousel hits={line.hits} /> : null}
            {line.cta ? (
              <div className={styles.ctas}>
                <GuideAnunciarCta cta={line.cta} />
              </div>
            ) : null}
          </div>
        ))}
        {loading ? (
          <p className={styles.loading} data-testid="guide-chat-loading">
            Rafi está buscando fichas reales…
          </p>
        ) : null}
      </div>
      <form className={styles.composer} onSubmit={onSubmit}>
        <input
          className={styles.input}
          data-testid="guide-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Hotel con pileta cerca del dique…"
          maxLength={500}
          disabled={loading}
          aria-label="Mensaje para Rafi"
        />
        <button className={styles.send} data-testid="guide-chat-send" type="submit" disabled={loading}>
          Enviar
        </button>
      </form>
    </section>
  );
}
