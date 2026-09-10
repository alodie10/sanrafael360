const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
]);

function ipv4ToInt(host: string): number | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

export function isPrivateOrLocalIp(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h.includes(":")) {
    if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) {
      return true;
    }
  }
  const mapped = h.startsWith("::ffff:") ? h.slice(7) : h;
  const ip = ipv4ToInt(mapped);
  if (ip === null) return false;
  const a = ip >>> 24;
  const b = (ip >>> 16) & 255;
  if (a === 0 || a === 10 || a === 127 || a === 224 || a >= 240) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function parsePublicHttpsUrl(raw: string): URL {
  const href = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  const url = new URL(href);
  if (url.protocol !== "https:") {
    throw new Error("Only https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("Invalid URL");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Host not allowed");
  }
  if (!host.includes(".")) {
    throw new Error("Host not allowed");
  }
  if (isPrivateOrLocalIp(host)) {
    throw new Error("Host not allowed");
  }
  return url;
}
