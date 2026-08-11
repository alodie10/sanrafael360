/** Login Strapi users-permissions (API) — para endpoints admin en E2E. */
export async function getStrapiJwt(
  strapiUrl: string,
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(`${strapiUrl.replace(/\/$/, '')}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      (payload as { error?: { message?: string } })?.error?.message ||
        `Strapi auth falló (${res.status})`
    );
  }

  const data = (await res.json()) as { jwt?: string };
  if (!data.jwt) throw new Error('Strapi auth sin JWT');
  return data.jwt;
}
