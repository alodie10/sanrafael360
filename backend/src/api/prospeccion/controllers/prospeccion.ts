import type { Core } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ForbiddenError, ValidationError } from '../../../utils/errors';
import { createProspeccionService } from '../services/prospeccion-service';

function assertAdmin(ctx: any) {
  if (!ctx.state?.adminUser) {
    throw new ForbiddenError('Acceso restringido a administradores');
  }
}

function adminUserId(ctx: any): number {
  assertAdmin(ctx);
  const id = ctx.state.adminUser.id;
  if (!id) throw new ValidationError('Usuario admin inválido');
  return id;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  getPlantilla: asyncHandler(async (ctx: any) => {
    const data = await createProspeccionService(strapi).getPlantilla(adminUserId(ctx));
    ctx.send({ data });
  }),

  updatePlantilla: asyncHandler(async (ctx: any) => {
    const { texto_ficha, mensaje, firma } = ctx.request.body || {};
    const data = await createProspeccionService(strapi).updatePlantilla(adminUserId(ctx), {
      texto_ficha,
      mensaje,
      firma: firma || '',
    });
    ctx.send({ data });
  }),

  listAlcanzados: asyncHandler(async (ctx: any) => {
    assertAdmin(ctx);
    const q = typeof ctx.query?.q === 'string' ? ctx.query.q : undefined;
    const startDate =
      typeof ctx.query?.startDate === 'string' ? ctx.query.startDate : undefined;
    const endDate = typeof ctx.query?.endDate === 'string' ? ctx.query.endDate : undefined;
    const data = await createProspeccionService(strapi).listAlcanzados({
      q,
      startDate,
      endDate,
    });
    ctx.send({ data });
  }),

  searchNegocios: asyncHandler(async (ctx: any) => {
    assertAdmin(ctx);
    const search = typeof ctx.query?.search === 'string' ? ctx.query.search : '';
    const data = await createProspeccionService(strapi).searchNegocios(search);
    ctx.send({ data });
  }),

  getNegocio: asyncHandler(async (ctx: any) => {
    assertAdmin(ctx);
    const data = await createProspeccionService(strapi).getNegocio(ctx.params.documentId);
    ctx.send({ data });
  }),

  enviar: asyncHandler(async (ctx: any) => {
    const { negocioDocumentId, tipo } = ctx.request.body || {};
    const data = await createProspeccionService(strapi).enviar(
      adminUserId(ctx),
      negocioDocumentId,
      tipo
    );
    ctx.send({ data });
  }),
});
