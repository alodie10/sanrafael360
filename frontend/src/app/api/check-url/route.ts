import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ reachable: false, error: "Missing url param" }, { status: 400 });
  }

  let finalUrl: string;
  try {
    finalUrl = url.startsWith("http") ? url : `https://${url}`;
    new URL(finalUrl); // throws if invalid
  } catch {
    return NextResponse.json({ reachable: false, error: "Invalid URL" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6 s timeout

    const res = await fetch(finalUrl, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SanRafael360Bot/1.0)",
      },
    });

    clearTimeout(timeout);

    // 2xx o 3xx = sitio accesible
    const reachable = res.status < 400;
    return NextResponse.json({ reachable, status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return NextResponse.json({ reachable: false, error: message });
  }
}
