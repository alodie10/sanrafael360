import { NextRequest, NextResponse } from "next/server";
import { resolvePortalPreview } from "@/lib/asistente/link-preview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith("/") || path.length > 180) {
    return NextResponse.json({ preview: null }, { status: 400 });
  }

  const preview = await resolvePortalPreview(path);
  return NextResponse.json(
    { preview },
    { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" } }
  );
}
