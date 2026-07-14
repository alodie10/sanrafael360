import { getStrapiUrl } from "@/lib/strapi";
export type StrapiGoogleAuthResponse = {
  jwt: string;
  user: {
    id: number;
    email?: string;
    username?: string;
  };
};

/**
 * Intercambia el access_token de Google por JWT de Strapi vía POST (sin token en URL).
 */
export async function exchangeGoogleAccessToken(
  accessToken: string
): Promise<StrapiGoogleAuthResponse> {
  const strapiUrl = getStrapiUrl();

  const res = await fetch(`${strapiUrl}/api/auth/google/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Strapi Error ${res.status}: Handshake fallido`;
    throw new Error(message);
  }

  return res.json();
}
