import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';
import {
  buildEncryptedMpTokenPatch,
  clearEncryptedMpTokenPatch,
  isComercioMpConfigured,
} from './mp-token';

const DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

function mediaUrl(media: any): string | null {
  if (!media?.url) return null;
  const url = String(media.url);
  if (url.startsWith('http')) return url;
  const base = (process.env.BACKEND_URL || 'http://localhost:1337').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

function parseNumber(value: unknown, label: string, min: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) {
    throw new ValidationError(`${label} debe ser ≥ ${min}`);
  }
  return n;
}

function normalizeHorario(raw: unknown) {
  if (!raw || typeof raw !== 'object') throw new ValidationError('horario inválido');
  const source = raw as { dias?: Record<string, unknown> };
  const diasIn =
    source.dias && typeof source.dias === 'object'
      ? source.dias
      : (raw as Record<string, unknown>);
  const dias: Record<string, Array<{ inicio: string; fin: string }>> = {};
  for (const key of DAY_KEYS) {
    const slots = Array.isArray(diasIn[key]) ? diasIn[key] : [];
    dias[key] = slots
      .filter((s: any) => s?.inicio && s?.fin)
      .map((s: any) => {
        const inicio = String(s.inicio).trim().slice(0, 5);
        const fin = String(s.fin).trim().slice(0, 5);
        return { inicio, fin };
      })
      .filter((s) => /^\d{2}:\d{2}$/.test(s.inicio) && /^\d{2}:\d{2}$/.test(s.fin));
  }
  return { dias };
}

function normalizePolitica(raw: unknown, current: any) {
  const base = current && typeof current === 'object' ? current : {};
  const incoming = raw && typeof raw === 'object' ? (raw as any) : {};
  const dentro = { ...(base.dentro_ventana || {}), ...(incoming.dentro_ventana || {}) };
  const fuera = { ...(base.fuera_ventana || {}), ...(incoming.fuera_ventana || {}) };
  const reembolso = Number(dentro.reembolso_porcentaje ?? 100);
  if (!Number.isFinite(reembolso) || reembolso < 0 || reembolso > 100) {
    throw new ValidationError('reembolso_porcentaje debe estar entre 0 y 100');
  }
  return {
    dentro_ventana: {
      reembolso_porcentaje: reembolso,
      cargo_fijo_ars: Number(dentro.cargo_fijo_ars ?? 0) || 0,
    },
    fuera_ventana: {
      permitir_self_service: Boolean(fuera.permitir_self_service ?? false),
      reembolso_porcentaje: Number(fuera.reembolso_porcentaje ?? 0) || 0,
      cargo_fijo_ars: fuera.cargo_fijo_ars ?? null,
    },
  };
}

function serializeConfig(comercio: any) {
  return {
    documentId: comercio.documentId,
    nombre: comercio.nombre,
    nombre_publico: comercio.nombre_publico,
    slug: comercio.slug,
    activo: comercio.activo !== false,
    timezone: comercio.timezone,
    duracion_minutos: comercio.duracion_minutos,
    buffer_limpieza_minutos: comercio.buffer_limpieza_minutos,
    anticipacion_llegada_minutos: comercio.anticipacion_llegada_minutos,
    texto_llegada: comercio.texto_llegada,
    precio_ars: Number(comercio.precio_ars),
    horario: comercio.horario,
    cancelacion_horas_minimas: comercio.cancelacion_horas_minimas,
    cancelacion_politica: comercio.cancelacion_politica,
    hold_ttl_minutos: comercio.hold_ttl_minutos,
    mp_token_env: comercio.mp_token_env || null,
    mp_configured: isComercioMpConfigured(comercio),
    mp_token_hint: comercio.mp_token_hint || null,
    modo_simulacion: Boolean(comercio.modo_simulacion),
    logo_url: mediaUrl(comercio.logo),
    portada_url: mediaUrl(comercio.imagen_portada),
  };
}

async function loadComercio(strapi: any, slug: string) {
  const repo = createReservaComercioRepository(strapi);
  const comercio = await repo.findBySlug(slug.trim(), {
    logo: { fields: ['url'] },
    imagen_portada: { fields: ['url'] },
  });
  if (!comercio) throw new NotFoundError('Comercio de reservas');
  return { repo, comercio };
}

function parseBody(rawBody: Record<string, unknown>) {
  let body = rawBody || {};
  if (typeof body.data === 'string') {
    try {
      body = { ...body, ...JSON.parse(body.data as string) };
    } catch {
      throw new ValidationError('data JSON inválido');
    }
  }
  return body;
}

function buildPatch(body: Record<string, unknown>, comercio: any) {
  const patch: Record<string, unknown> = {};
  if (body.nombre_publico !== undefined) {
    patch.nombre_publico = String(body.nombre_publico || '').trim() || null;
  }
  if (body.texto_llegada !== undefined) {
    patch.texto_llegada = String(body.texto_llegada || '').trim();
  }
  if (body.precio_ars !== undefined) {
    patch.precio_ars = parseNumber(body.precio_ars, 'precio_ars', 1);
  }
  if (body.duracion_minutos !== undefined) {
    patch.duracion_minutos = parseNumber(body.duracion_minutos, 'duracion_minutos', 15);
  }
  if (body.buffer_limpieza_minutos !== undefined) {
    patch.buffer_limpieza_minutos = parseNumber(body.buffer_limpieza_minutos, 'buffer', 0);
  }
  if (body.anticipacion_llegada_minutos !== undefined) {
    patch.anticipacion_llegada_minutos = parseNumber(body.anticipacion_llegada_minutos, 'anticipacion', 0);
  }
  if (body.hold_ttl_minutos !== undefined) {
    patch.hold_ttl_minutos = parseNumber(body.hold_ttl_minutos, 'hold_ttl_minutos', 5);
  }
  if (body.cancelacion_horas_minimas !== undefined) {
    patch.cancelacion_horas_minimas = parseNumber(body.cancelacion_horas_minimas, 'cancelacion_horas', 0);
  }
  if (body.modo_simulacion !== undefined) {
    patch.modo_simulacion = parseBool(body.modo_simulacion, Boolean(comercio.modo_simulacion));
  }
  if (body.activo !== undefined) {
    patch.activo = parseBool(body.activo, comercio.activo !== false);
  }
  if (body.horario !== undefined) {
    try {
      const horario = typeof body.horario === 'string' ? JSON.parse(body.horario) : body.horario;
      patch.horario = normalizeHorario(horario);
    } catch {
      throw new ValidationError('horario JSON inválido');
    }
  }
  applyPoliticaPatch(body, comercio, patch);
  applyMpTokenPatch(body, patch);
  return patch;
}

function applyPoliticaPatch(
  body: Record<string, unknown>,
  comercio: any,
  patch: Record<string, unknown>
) {
  let current = comercio.cancelacion_politica;
  if (body.cancelacion_politica !== undefined) {
    const politica =
      typeof body.cancelacion_politica === 'string'
        ? JSON.parse(body.cancelacion_politica as string)
        : body.cancelacion_politica;
    current = normalizePolitica(politica, current);
    patch.cancelacion_politica = current;
  }
  if (body.reembolso_porcentaje !== undefined) {
    patch.cancelacion_politica = normalizePolitica(
      { dentro_ventana: { reembolso_porcentaje: Number(body.reembolso_porcentaje) } },
      current
    );
  }
}

function applyMpTokenPatch(body: Record<string, unknown>, patch: Record<string, unknown>) {
  const clear =
    body.mp_access_token_clear === true ||
    body.mp_access_token_clear === 'true' ||
    body.mp_access_token_clear === '1';
  if (clear) {
    Object.assign(patch, clearEncryptedMpTokenPatch());
    return;
  }
  if (body.mp_access_token !== undefined && body.mp_access_token !== null) {
    const raw = String(body.mp_access_token).trim();
    if (!raw) {
      Object.assign(patch, clearEncryptedMpTokenPatch());
      return;
    }
    Object.assign(patch, buildEncryptedMpTokenPatch(raw));
  }
}

async function uploadMediaIfPresent(
  repo: ReturnType<typeof createReservaComercioRepository>,
  documentId: string,
  files?: Record<string, any>
) {
  if (!files) return;
  const logo = files.logo || files['files.logo'];
  const cover = files.imagen_portada || files['files.imagen_portada'];
  if (logo) await repo.uploadFile(documentId, 'logo', logo);
  if (cover) await repo.uploadFile(documentId, 'imagen_portada', cover);
}

export async function adminGetConfig(strapi: any, slug: string) {
  const { comercio } = await loadComercio(strapi, slug);
  return serializeConfig(comercio);
}

export async function adminUpdateConfig(
  strapi: any,
  slug: string,
  rawBody: Record<string, unknown>,
  files?: Record<string, any>
) {
  const { repo, comercio } = await loadComercio(strapi, slug);
  const body = parseBody(rawBody);
  const patch = buildPatch(body, comercio);
  if (Object.keys(patch).length) {
    await repo.update(comercio.documentId, patch);
  }
  await uploadMediaIfPresent(repo, comercio.documentId, files);
  const refreshed = await repo.findByDocumentId(comercio.documentId);
  return serializeConfig(refreshed);
}
