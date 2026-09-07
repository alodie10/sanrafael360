/**
 * Marca visual de ambiente local. En Vercel/Railway (NODE_ENV=production) es false.
 * Dev = cian. Prod = oro original.
 */
export function isDevApp(): boolean {
  return process.env.NODE_ENV === "development";
}
