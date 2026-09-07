const RESERVED_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "accounts",
  "about",
  "legal",
  "tv",
  "tags",
  "locations",
  "direct",
  "m",
  "share",
  "nametag",
]);

function isValidHandle(value: string): boolean {
  if (value.length < 1 || value.length > 30) return false;
  if (!/^[a-z0-9._]+$/.test(value)) return false;
  if (value.startsWith(".") || value.endsWith(".")) return false;
  if (value.includes("..")) return false;
  return true;
}

function extractHandleFromPossibleUrl(raw: string): string | null {
  const cleaned = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const igme = cleaned.match(/^ig\.me\/m\/([^/?#]+)/i);
  if (igme?.[1]) return decodeURIComponent(igme[1]);

  const insta = cleaned.match(/^(?:instagram\.com|instagr\.am)\/([^/?#]+)/i);
  if (!insta?.[1]) return null;
  const segment = decodeURIComponent(insta[1]);
  if (RESERVED_PATHS.has(segment.toLowerCase())) return null;
  return segment;
}

/** Usuario de Instagram sin @. Acepta handle, URL de perfil o ig.me/m/usuario. */
export function normalizeInstagramUsername(raw?: string | null): string | null {
  let value = String(raw || "").trim();
  if (!value) return null;
  value = value.replace(/^@+/, "");

  const fromUrl = extractHandleFromPossibleUrl(value);
  if (fromUrl) value = fromUrl;

  value = value.split(/[/?#\s]/)[0].replace(/^@+/, "").toLowerCase();
  return isValidHandle(value) ? value : null;
}

/** DM de Instagram. Meta no soporta ?text=; el mensaje se copia al portapapeles. */
export function buildInstagramDmUrl(raw?: string | null): string | null {
  const username = normalizeInstagramUsername(raw);
  if (!username) return null;
  return `https://ig.me/m/${username}`;
}

/** Reusa la misma pestaña/ventana de IG en vez de abrir una nueva en cada envío. */
export const INSTAGRAM_DM_WINDOW = "sr360-instagram";

export function openInstagramDm(url: string): void {
  if (typeof window === "undefined" || !url) return;
  const win = window.open(url, INSTAGRAM_DM_WINDOW);
  if (win) {
    try {
      win.opener = null;
    } catch {
      // ignore
    }
  }
}

export function resolveInstagramUsername(input: {
  instagram_username?: string | null;
  instagram?: string | null;
}): string | null {
  return (
    normalizeInstagramUsername(input.instagram_username) ||
    normalizeInstagramUsername(input.instagram)
  );
}
