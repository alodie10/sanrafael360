import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchFromStrapi, isStrapiUnreachableError } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session as { jwt?: string }).jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetchFromStrapi("negocios/favoritos/me", {
      headers: {
        Authorization: `Bearer ${(session as { jwt: string }).jwt}`,
      },
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (isStrapiUnreachableError(error)) {
      return NextResponse.json({ data: [] });
    }
    const message = error instanceof Error ? error.message : "Error al cargar favoritos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as { jwt?: string }).jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const response = await fetchFromStrapi(`negocios/${documentId}/toggle-favorite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(session as { jwt: string }).jwt}`,
      },
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (isStrapiUnreachableError(error)) {
      return NextResponse.json(
        { error: "Backend no disponible. Intentá de nuevo en unos segundos." },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Error al actualizar favoritos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
