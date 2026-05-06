export function normalizeTimeForDB(time: string): string {
  if (!time) return '00:00:00.000';
  const parts = time.split(':');
  const h = String(parseInt(parts[0] || '0', 10)).padStart(2, '0');
  const m = String(parseInt(parts[1] || '0', 10)).padStart(2, '0');
  const secParts = (parts[2] || '0').split('.');
  const s = String(parseInt(secParts[0] || '0', 10)).padStart(2, '0');
  const ms = String(parseInt(secParts[1] || '0', 10)).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export async function logActivity(strapi: any, tipo: 'info' | 'warning' | 'success' | 'error', accion: string, detalles: string, negocioId?: string, user?: any) {
  try {
    if (user && user.id) {
      await (strapi.documents('api::actividad.actividad' as any) as any).create({
        data: {
          tipo,
          accion,
          detalles,
          negocio: negocioId,
          usuario: user.id,
        }
      });
    }
  } catch (err: any) {
    strapi.log.error(`[ActivityLog] Error persistente: ${err.message}`);
  }
}
