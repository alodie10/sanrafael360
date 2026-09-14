import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getCloudinaryServerConfig,
  normalizeCloudinaryFolder,
  signCloudinaryUploadParams,
} from "@/lib/cloudinary-sign.server";

/**
 * POST /api/cloudinary-sign
 *
 * Firma subidas directas a Cloudinary desde el portal (videos / avisos).
 * El API_SECRET nunca llega al cliente.
 *
 * Body: { folder?: string }
 * Returns: { signature, timestamp, api_key, cloud_name, folder }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.jwt) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { cloudName, apiKey, apiSecret, algorithm } = getCloudinaryServerConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado en el servidor" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  let folder: string;
  try {
    folder = normalizeCloudinaryFolder(
      typeof body.folder === "string" && body.folder.trim()
        ? body.folder.trim()
        : "sanrafael360_galeria"
    );
  } catch {
    return NextResponse.json({ error: "folder no permitido" }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signParams = { folder, timestamp, overwrite: "false" as const };
  const signature = signCloudinaryUploadParams(signParams, apiSecret, algorithm);

  return NextResponse.json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
    overwrite: false,
  });
}
