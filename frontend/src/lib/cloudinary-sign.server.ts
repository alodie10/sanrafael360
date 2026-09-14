import crypto from "crypto";

export type CloudinarySignAlgorithm = "sha1" | "sha256";

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  }
  return undefined;
}

/**
 * Acepta nombres FE (CLOUDINARY_CLOUD_NAME/API_*) y BE (CLOUDINARY_NAME/KEY/SECRET).
 */
export function getCloudinaryServerConfig() {
  const cloudName = firstEnv("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_NAME");
  const apiKey = firstEnv("CLOUDINARY_API_KEY", "CLOUDINARY_KEY");
  const apiSecret = firstEnv("CLOUDINARY_API_SECRET", "CLOUDINARY_SECRET");
  const algorithm = (firstEnv("CLOUDINARY_SIGNATURE_ALGORITHM")?.toLowerCase() === "sha256"
    ? "sha256"
    : "sha1") as CloudinarySignAlgorithm;

  return { cloudName, apiKey, apiSecret, algorithm };
}

export const ALLOWED_CLOUDINARY_FOLDERS = [
  "sanrafael360_galeria",
  "sanrafael360_avisos",
] as const;

export type AllowedCloudinaryFolder = (typeof ALLOWED_CLOUDINARY_FOLDERS)[number];

export function normalizeCloudinaryFolder(raw: unknown): AllowedCloudinaryFolder {
  if (typeof raw !== "string") {
    throw new Error("folder no permitido");
  }
  const folder = raw.trim();
  if (!ALLOWED_CLOUDINARY_FOLDERS.includes(folder as AllowedCloudinaryFolder)) {
    throw new Error("folder no permitido");
  }
  if (/[&=?]/.test(folder)) {
    throw new Error("folder no permitido");
  }
  return folder as AllowedCloudinaryFolder;
}

/** Firma parámetros de upload (orden alfabético; excluye file, api_key, cloud_name, resource_type). */
export function signCloudinaryUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
  algorithm: CloudinarySignAlgorithm = "sha1"
): string {
  const paramsToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash(algorithm).update(paramsToSign + apiSecret).digest("hex");
}
