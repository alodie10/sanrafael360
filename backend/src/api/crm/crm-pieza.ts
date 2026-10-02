import crypto from 'crypto';
import { ValidationError } from '../../utils/errors';
import { PLANTILLA_SLOT_COUNT } from '../../utils/plantilla-slots';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PREVIEW_TRANSFORM = 'f_jpg,q_auto,c_limit,w_1200';

export type CrmPiezaCard = {
  slotIndex: number;
  token: string;
  titulo: string;
  imageUrl: string;
  pageUrl: string;
};

export type CrmPiezaPublica = CrmPiezaCard & {
  previewUrl: string;
  width: number | null;
  height: number | null;
};

export function frontendBaseUrl(): string {
  const raw = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || '')
    .trim()
    .replace(/^=/, '')
    .replace(/\/$/, '');
  if (raw) return raw;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return 'https://www.sanrafael360.com';
}

export function mediaBaseUrl(): string {
  return (process.env.PUBLIC_URL || 'http://localhost:1337').trim().replace(/\/$/, '');
}

export function assertPlantillaSlotIndex(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= PLANTILLA_SLOT_COUNT) {
    throw new ValidationError('plantillaIndex inválido');
  }
  return n;
}

export function pickPiezaFile(files: Record<string, unknown> | null | undefined) {
  if (!files) return null;
  const raw = files.imagen || files.file || files['files.imagen'] || files['files.file'];
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function assertPiezaImage(file: { mimetype?: string; size?: number } | null | undefined) {
  if (!file) throw new ValidationError('Subí una imagen JPG, PNG o WEBP');
  if (!IMAGE_MIME.has(String(file.mimetype || ''))) {
    throw new ValidationError('La imagen tiene que ser JPG, PNG o WEBP');
  }
  if (Number(file.size || 0) > MAX_IMAGE_BYTES) {
    throw new ValidationError('La imagen supera 8 MB');
  }
}

export function newPiezaToken(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export function isPiezaToken(raw: unknown): raw is string {
  return typeof raw === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(raw);
}

export function absoluteMediaUrl(url: string | null | undefined, base = mediaBaseUrl()): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** JPG acotado para que el rastreador de WhatsApp arme la vista previa. */
export function whatsappPreviewImage(url: string): string {
  const marker = '/upload/';
  const cut = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || cut < 0) return url;
  const tail = url.slice(cut + marker.length);
  if (tail.startsWith(`${PREVIEW_TRANSFORM}/`)) return url;
  return `${url.slice(0, cut + marker.length)}${PREVIEW_TRANSFORM}/${tail}`;
}

export function piezaPageUrl(token: string, base = frontendBaseUrl()): string {
  return `${base}/pieza/${token}`;
}

export function mapCrmPieza(row: any): CrmPiezaPublica | null {
  const imageUrl = absoluteMediaUrl(row?.imagen?.url);
  if (!row?.token || !imageUrl) return null;
  const titulo = String(row.titulo || '').trim() || 'San Rafael 360';
  const previewUrl = whatsappPreviewImage(imageUrl);
  const sameFile = previewUrl === imageUrl;
  return {
    slotIndex: Number(row.slot_index),
    token: String(row.token),
    titulo,
    imageUrl,
    previewUrl,
    pageUrl: piezaPageUrl(String(row.token)),
    width: sameFile ? Number(row.imagen?.width) || null : null,
    height: sameFile ? Number(row.imagen?.height) || null : null,
  };
}

export function mapCrmPiezaCard(row: any): CrmPiezaCard | null {
  const pieza = mapCrmPieza(row);
  if (!pieza) return null;
  return {
    slotIndex: pieza.slotIndex,
    token: pieza.token,
    titulo: pieza.titulo,
    imageUrl: pieza.imageUrl,
    pageUrl: pieza.pageUrl,
  };
}
