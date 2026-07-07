export type StrapiLocalAuthResponse = {
  jwt: string;
  user: {
    id: number;
    email: string;
    username?: string;
  };
};

/** Login email/password contra Strapi users-permissions (solo tests / tooling server-side). */
export async function authenticateStrapiLocal(
  identifier: string,
  password: string
): Promise<StrapiLocalAuthResponse> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const res = await fetch(`${strapiUrl}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message =
      (payload as { error?: { message?: string } })?.error?.message ||
      `Autenticación Strapi falló (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<StrapiLocalAuthResponse>;
}
