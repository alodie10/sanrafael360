import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPortalStats } from "@/lib/portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const jwt = (session as { jwt?: string } | null)?.jwt;

  if (!session || !jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const stats = await getPortalStats(jwt, startDate, endDate);
    if (!stats) {
      return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
    }

    return NextResponse.json({ data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al cargar estadísticas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
