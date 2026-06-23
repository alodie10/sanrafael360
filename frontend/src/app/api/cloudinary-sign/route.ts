import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/cloudinary-sign
 * 
 * Genera una firma HMAC-SHA1 para subida directa a Cloudinary desde el navegador.
 * El API_SECRET nunca llega al cliente — la firma se genera aquí en el servidor Next.js.
 * 
 * Body: { folder?: string, resource_type?: string }
 * Returns: { signature, timestamp, api_key, cloud_name, folder }
 */
export async function POST(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado en el servidor" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const folder = body.folder ?? "sanrafael360_galeria";

  const timestamp = Math.round(Date.now() / 1000);

  // Los parámetros que se firman deben estar en orden alfabético
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName, folder });
}
