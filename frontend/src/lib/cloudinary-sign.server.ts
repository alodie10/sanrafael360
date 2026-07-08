import crypto from "crypto";

export type CloudinarySignAlgorithm = "sha1" | "sha256";

export function getCloudinaryServerConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const algorithm = (process.env.CLOUDINARY_SIGNATURE_ALGORITHM?.trim().toLowerCase() === "sha256"
    ? "sha256"
    : "sha1") as CloudinarySignAlgorithm;

  return { cloudName, apiKey, apiSecret, algorithm };
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
