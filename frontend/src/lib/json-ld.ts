/** Safe JSON-LD for <script type="application/ld+json"> (blocks </script> breakout). */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
