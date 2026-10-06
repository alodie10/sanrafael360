"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import {
  portalPathsInMessage,
  splitGuideMessage,
  type GuideTextPart,
  type PortalPreview,
} from "@/lib/asistente/message-links";
import { getSiteUrl } from "@/lib/site";
import styles from "./GuideChat.module.css";

const COVER = "c_fill,g_auto,w_240,h_240,f_auto,q_auto";
const previewCache = new Map<string, PortalPreview | null>();
const previewInflight = new Map<string, Promise<PortalPreview | null>>();

function loadPreview(path: string): Promise<PortalPreview | null> {
  if (previewCache.has(path)) return Promise.resolve(previewCache.get(path) ?? null);
  const pending = previewInflight.get(path);
  if (pending) return pending;

  const request = fetch(`/api/asistente/preview?path=${encodeURIComponent(path)}`)
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = (await response.json()) as { preview?: PortalPreview | null };
      return payload.preview ?? null;
    })
    .catch(() => null)
    .then((preview) => {
      previewCache.set(path, preview);
      previewInflight.delete(path);
      return preview;
    });

  previewInflight.set(path, request);
  return request;
}

function LinkLabel({ label }: { label: string }) {
  const bits = label.split(/([/.])/);
  return bits.map((bit, index) =>
    bit === "/" || bit === "." ? (
      <span key={index}>
        {bit}
        <wbr />
      </span>
    ) : (
      <span key={index}>{bit}</span>
    )
  );
}

function GuideInlineLink({ part }: { part: Extract<GuideTextPart, { type: "link" }> }) {
  const label = <LinkLabel label={part.label} />;
  if (part.href.startsWith("/")) {
    return (
      <Link href={part.href} className={styles.inlineLink} data-testid="guide-message-link">
        {label}
      </Link>
    );
  }
  return (
    <a
      href={part.href}
      className={styles.inlineLink}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="guide-message-link"
    >
      {label}
    </a>
  );
}

export function GuideMessageText({ text }: { text: string }) {
  const parts = splitGuideMessage(text, getSiteUrl());
  return parts.map((part, index) =>
    part.type === "text" ? (
      <span key={index}>{part.text}</span>
    ) : (
      <GuideInlineLink key={index} part={part} />
    )
  );
}

function GuidePortalPreviewCard({ path }: { path: string }) {
  const [preview, setPreview] = useState<PortalPreview | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    loadPreview(path).then((value) => {
      if (live) setPreview(value);
    });
    return () => {
      live = false;
    };
  }, [path]);

  if (preview === undefined) {
    return <div className={styles.previewSkeleton} aria-hidden />;
  }
  if (!preview) return null;

  const image = preview.imageUrl
    ? optimizeCloudinaryUrl(preview.imageUrl, COVER) || preview.imageUrl
    : null;

  return (
    <Link href={preview.path} className={styles.preview} data-testid="guide-link-preview">
      <span className={styles.previewCover}>
        {image ? (
          <Image src={image} alt="" fill sizes="72px" className={styles.cardCoverImg} />
        ) : (
          <span className={styles.cardCoverEmpty} />
        )}
      </span>
      <span className={styles.previewBody}>
        {preview.kicker ? <span className={styles.previewKicker}>{preview.kicker}</span> : null}
        <span className={styles.previewTitle}>{preview.title}</span>
        {preview.description ? <span className={styles.previewText}>{preview.description}</span> : null}
        <span className={styles.previewHost}>sanrafael360.com</span>
      </span>
    </Link>
  );
}

export function GuidePortalPreviews({ text, skipPaths = [] }: { text: string; skipPaths?: string[] }) {
  const skip = new Set(skipPaths);
  const paths = portalPathsInMessage(text, getSiteUrl()).filter((path) => !skip.has(path));
  if (!paths.length) return null;
  return (
    <div className={styles.previews}>
      {paths.map((path) => (
        <GuidePortalPreviewCard key={path} path={path} />
      ))}
    </div>
  );
}
