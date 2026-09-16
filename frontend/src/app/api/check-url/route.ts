import { lookup } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { consumeIpRateLimit } from "@/lib/asistente/rate-limit";
import {
  isPrivateOrLocalIp,
  parsePublicHttpsUrl,
} from "@/lib/safe-outbound-url";

export const runtime = "nodejs";

async function hostHasPrivateIp(hostname: string): Promise<boolean> {
  const resolved = await lookup(hostname, { all: true });
  return resolved.some((r) => isPrivateOrLocalIp(r.address));
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ reachable: false }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  if (!consumeIpRateLimit(`check-url:${ip}`, Date.now(), 40, 60_000).allowed) {
    return NextResponse.json({ reachable: false }, { status: 429 });
  }

  let target: URL;
  try {
    target = parsePublicHttpsUrl(raw);
  } catch {
    return NextResponse.json({ reachable: false }, { status: 400 });
  }

  try {
    if (await hostHasPrivateIp(target.hostname)) {
      return NextResponse.json({ reachable: false }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ reachable: false });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(target.href, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SanRafael360Bot/1.0)" },
    });
    clearTimeout(timeout);
    if (await hostHasPrivateIp(target.hostname)) {
      return NextResponse.json({ reachable: false }, { status: 400 });
    }
    return NextResponse.json({ reachable: res.status < 400 });
  } catch {
    return NextResponse.json({ reachable: false });
  }
}
