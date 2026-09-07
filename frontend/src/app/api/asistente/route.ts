import { NextRequest, NextResponse } from "next/server";
import { loadGuideRuntime, resolveLiveAsistenteConfig } from "@/lib/asistente/live-store";
import { handleGuideTurn } from "@/lib/asistente/dialog";
import { parseGuideRequest } from "@/lib/asistente/parse-request";
import {
  consumeRateLimit,
  parseRateLimitCookie,
  RATE_LIMIT_COOKIE,
} from "@/lib/asistente/rate-limit";

export const dynamic = "force-dynamic";

async function currentConfig() {
  const runtime = await loadGuideRuntime();
  return resolveLiveAsistenteConfig(runtime);
}

function pausedResponse() {
  return NextResponse.json(
    {
      type: "error",
      text: "El asistente está pausado. Usá la búsqueda de arriba.",
      hits: [],
    },
    { status: 503 }
  );
}

function publicConfig(config: Awaited<ReturnType<typeof currentConfig>>) {
  return {
    enabled: config.enabled,
    copyIntro: config.copyIntro,
    pageAllowlist: config.pageAllowlist,
  };
}

export async function GET() {
  const config = await currentConfig();
  if (!config.enabled) return pausedResponse();
  return NextResponse.json(publicConfig(config));
}

export async function POST(request: NextRequest) {
  const config = await currentConfig();
  if (!config.enabled) return pausedResponse();

  const now = Date.now();
  const current = parseRateLimitCookie(request.cookies.get(RATE_LIMIT_COOKIE)?.value, now);
  const rate = consumeRateLimit(current, now, config.rateLimitMax, config.rateLimitWindowMs);
  if (!rate.allowed) {
    const limited = NextResponse.json({
      type: "error",
      text: "Llegaste al límite de mensajes por ahora. Probá la búsqueda de arriba o volvé en un rato.",
      hits: [],
    });
    limited.cookies.set(RATE_LIMIT_COOKIE, JSON.stringify(rate.next), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.ceil(config.rateLimitWindowMs / 1000),
    });
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const parsed = parseGuideRequest(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await handleGuideTurn(parsed);
  const response = NextResponse.json(result);
  response.cookies.set(RATE_LIMIT_COOKIE, JSON.stringify(rate.next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(config.rateLimitWindowMs / 1000),
  });
  return response;
}
