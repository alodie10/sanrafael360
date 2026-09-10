import { lookup } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import {
  isPrivateOrLocalIp,
  parsePublicHttpsUrl,
} from "@/lib/safe-outbound-url";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ reachable: false }, { status: 400 });
  }

  let target: URL;
  try {
    target = parsePublicHttpsUrl(raw);
  } catch {
    return NextResponse.json({ reachable: false }, { status: 400 });
  }

  try {
    const resolved = await lookup(target.hostname, { all: true });
    if (resolved.some((r) => isPrivateOrLocalIp(r.address))) {
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
    return NextResponse.json({ reachable: res.status < 400 });
  } catch {
    return NextResponse.json({ reachable: false });
  }
}
