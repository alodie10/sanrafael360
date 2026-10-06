export type GuideTextPart =
  | { type: "text"; text: string }
  | { type: "link"; href: string; label: string; portalPath: string | null };

export type PortalPreviewTarget = {
  kind: "efemeride" | "negocio" | "categoria";
  slug: string;
  path: string;
};

export type PortalPreview = {
  path: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  kicker: string | null;
};

const SLUG = "[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*";

function messageLinkPattern(): RegExp {
  return new RegExp(
    `\\[([^\\]]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)|https?:\\/\\/[^\\s<>"']+|\\/(?:efemerides|negocios|categoria)\\/${SLUG}\\/?`,
    "gi"
  );
}

const PORTAL_PATH = new RegExp(`^\\/(efemerides|negocios|categoria)\\/(${SLUG})$`, "i");

const KIND_BY_SEGMENT = {
  efemerides: "efemeride",
  negocios: "negocio",
  categoria: "categoria",
} as const;

function portalHosts(siteUrl: string): Set<string> {
  const hosts = new Set(["sanrafael360.com", "www.sanrafael360.com", "localhost", "127.0.0.1"]);
  try {
    const host = new URL(siteUrl).hostname.toLowerCase();
    hosts.add(host);
    if (host.startsWith("www.")) hosts.add(host.slice(4));
    else if (host !== "localhost" && host !== "127.0.0.1") hosts.add(`www.${host}`);
  } catch {
    /* La URL del sitio no parsea: quedan los hosts de producción. */
  }
  return hosts;
}

/** Ruta relativa de una ficha, rubro o efeméride. Rechaza protocolos y `..`. */
export function parsePortalPreviewPath(raw: string): PortalPreviewTarget | null {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("..")) {
    return null;
  }
  const bare = raw.split("?")[0]?.split("#")[0] ?? "";
  let path = bare;
  try {
    path = decodeURIComponent(bare);
  } catch {
    return null;
  }
  path = path.replace(/\/+$/, "");
  if (!path || path.length > 180) return null;
  const match = path.match(PORTAL_PATH);
  if (!match) return null;
  const segment = match[1].toLowerCase() as keyof typeof KIND_BY_SEGMENT;
  const slug = match[2];
  if (slug.length > 80) return null;
  return { kind: KIND_BY_SEGMENT[segment], slug, path: `/${segment}/${slug}` };
}

function peelTrailing(raw: string): { core: string; rest: string } {
  let core = raw;
  let rest = "";
  while (core.length && /[.,;:!?)\]]/.test(core.slice(-1))) {
    const last = core.slice(-1);
    if (last === ")" && count(core, "(") >= count(core, ")")) break;
    rest = last + rest;
    core = core.slice(0, -1);
  }
  return { core, rest };
}

function count(value: string, char: string): number {
  return value.split(char).length - 1;
}

function pushLink(parts: GuideTextPart[], rawHref: string, label: string, hosts: Set<string>) {
  if (rawHref.startsWith("/")) {
    const target = parsePortalPreviewPath(rawHref);
    if (!target) {
      parts.push({ type: "text", text: label });
      return;
    }
    parts.push({ type: "link", href: target.path, label, portalPath: target.path });
    return;
  }

  let url: URL;
  try {
    url = new URL(rawHref);
  } catch {
    parts.push({ type: "text", text: label });
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    parts.push({ type: "text", text: label });
    return;
  }

  const samePortal = hosts.has(url.hostname.toLowerCase());
  const target = samePortal ? parsePortalPreviewPath(url.pathname) : null;
  const href = samePortal ? `${url.pathname.replace(/\/+$/, "") || "/"}${url.search}` : url.href;
  parts.push({
    type: "link",
    href: target?.path ?? href,
    label,
    portalPath: target?.path ?? null,
  });
}

/** Parte el texto de Rafi en texto y links. El punto final de la oración queda afuera del link. */
export function splitGuideMessage(text: string, siteUrl = "https://www.sanrafael360.com"): GuideTextPart[] {
  const hosts = portalHosts(siteUrl);
  const parts: GuideTextPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(messageLinkPattern())) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "text", text: text.slice(cursor, index) });

    if (match[1] && match[2]) {
      pushLink(parts, match[2], match[1], hosts);
    } else {
      const peeled = peelTrailing(match[0]);
      pushLink(parts, peeled.core, peeled.core, hosts);
      if (peeled.rest) parts.push({ type: "text", text: peeled.rest });
    }
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push({ type: "text", text: text.slice(cursor) });
  return parts.length ? parts : [{ type: "text", text }];
}

export function portalPathsInMessage(text: string, siteUrl = "https://www.sanrafael360.com"): string[] {
  const seen = new Set<string>();
  for (const part of splitGuideMessage(text, siteUrl)) {
    if (part.type === "link" && part.portalPath) seen.add(part.portalPath);
  }
  return [...seen];
}
