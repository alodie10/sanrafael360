/**
 * Orden de galería: se persiste en galeria_config[id].orden
 * para no depender del orden de la relación media en Strapi.
 */

type GaleriaConfig = Record<string, any> | null | undefined;

function readOrden(config: GaleriaConfig, id: number | string | undefined): number | null {
  if (id == null || !config) return null;
  const entry = config[String(id)];
  if (entry && typeof entry.orden === "number") return entry.orden;
  return null;
}

/** Ordena medios por galeria_config[id].orden; sin orden guardado, respeta el array original. */
export function sortGaleriaByOrden<T extends { id?: number | string }>(
  galeria: T[] | null | undefined,
  galeriaConfig?: GaleriaConfig
): T[] {
  if (!galeria?.length) return [];

  const hasAnyOrden = galeria.some((item) => readOrden(galeriaConfig, item.id) !== null);
  if (!hasAnyOrden) return [...galeria];

  return [...galeria]
    .map((item, index) => ({
      item,
      index,
      orden: readOrden(galeriaConfig, item.id) ?? 10_000 + index,
    }))
    .sort((a, b) => a.orden - b.orden || a.index - b.index)
    .map(({ item }) => item);
}

/** Escribe índices 0..n-1 en galeria_config según el array actual. */
export function syncGaleriaOrden(
  galeria: { id?: number | string }[],
  galeriaConfig: Record<string, any>
): Record<string, any> {
  const next = { ...galeriaConfig };
  galeria.forEach((item, index) => {
    if (item.id == null) return;
    const key = String(item.id);
    next[key] = { ...(next[key] || {}), orden: index };
  });
  return next;
}
