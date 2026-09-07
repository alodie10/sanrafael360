"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackGuideEvent } from "@/lib/asistente/analytics";
import { subscribeMobileSearchExpanded } from "@/lib/search-expanded";
import GuideChatPanel from "./GuideChatPanel";
import GuideRafiMark from "./GuideRafiMark";
import styles from "./GuideChat.module.css";

const HIDDEN_PREFIXES = ["/portal", "/login", "/registro", "/asistente"];

function isHiddenPath(pathname: string, allowlist: string[] | null): boolean {
  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  if (!allowlist?.length) return false;
  return !allowlist.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function GuideChatWidget({
  intro,
  allowlist,
}: {
  intro: string;
  allowlist: string[] | null;
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => subscribeMobileSearchExpanded((expanded) => {
    setSearchExpanded(expanded);
    if (expanded) setOpen(false);
  }), []);

  if (isHiddenPath(pathname, allowlist) || searchExpanded) return null;

  return (
    <div data-testid="guide-chat-widget">
      {open ? (
        <GuideChatPanel intro={intro} variant="widget" onClose={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          className={styles.launcher}
          data-testid="guide-chat-open"
          aria-label="Abrir chat con Rafi"
          onClick={() => {
            setOpen(true);
            trackGuideEvent("guide_chat_opened");
          }}
        >
          <GuideRafiMark size="lg" />
        </button>
      )}
    </div>
  );
}
