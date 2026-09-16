import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { getPortalNegocios } from "@/lib/portal";
import {
  decideCloudinarySignAccess,
  getCloudinaryServerConfig,
  normalizeCloudinaryFolder,
  signCloudinaryUploadParams,
} from "@/lib/cloudinary-sign.server";

function isCloudinaryAdminUser(user?: {
  email?: string | null;
  role?: string | null;
} | null): boolean {
  const email = user?.email?.toLowerCase() ?? "";
  const role = user?.role?.toLowerCase() ?? "";
  return role === "admin" || role === "super admin" || ADMIN_EMAILS.includes(email);
}

function forbidden() {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

async function authorizeSign(
  folder: ReturnType<typeof normalizeCloudinaryFolder>,
  jwt: string,
  user: { email?: string | null; role?: string | null } | undefined
) {
  const decision = decideCloudinarySignAccess({
    folder,
    isAdmin: isCloudinaryAdminUser(user),
  });
  if (decision === "forbid") return forbidden();
  if (decision !== "need_owner") return null;
  const negocios = await getPortalNegocios(jwt);
  if (!Array.isArray(negocios) || negocios.length === 0) return forbidden();
  return null;
}

/**
 * POST /api/cloudinary-sign
 * Firma subidas directas a Cloudinary. El API_SECRET no sale del servidor.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const jwt = (session as { jwt?: string } | null)?.jwt;
  if (!jwt) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { cloudName, apiKey, apiSecret, algorithm } = getCloudinaryServerConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado en el servidor" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  let folder: ReturnType<typeof normalizeCloudinaryFolder>;
  try {
    folder = normalizeCloudinaryFolder(
      typeof body.folder === "string" && body.folder.trim()
        ? body.folder.trim()
        : "sanrafael360_galeria"
    );
  } catch {
    return NextResponse.json({ error: "folder no permitido" }, { status: 400 });
  }

  const denied = await authorizeSign(folder, jwt, session?.user);
  if (denied) return denied;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = signCloudinaryUploadParams(
    { folder, timestamp, overwrite: "false" as const },
    apiSecret,
    algorithm
  );

  return NextResponse.json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
    overwrite: false,
  });
}
