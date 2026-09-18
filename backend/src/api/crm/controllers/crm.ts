import type { Core } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { createCrmService } from '../services/crm-service';
import type { CrmActor } from '../crm-tenant';

function actorFrom(ctx: any): CrmActor {
  const user = ctx.state?.adminUser || ctx.state?.user;
  return {
    isAdmin: Boolean(ctx.state?.adminUser),
    email: String(user?.email || ''),
  };
}

function slugFrom(ctx: any): string | undefined {
  const fromQuery = ctx.query?.slug;
  const fromBody = ctx.request.body?.slug;
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();
  return undefined;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  bootstrap: asyncHandler(async (ctx: any) => {
    ctx.send({ data: await createCrmService(strapi).bootstrap(actorFrom(ctx), slugFrom(ctx)) });
  }),

  listContactos: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).listContactos(
        actorFrom(ctx),
        ctx.state.crmListQuery,
        slugFrom(ctx)
      ),
    });
  }),

  createManual: asyncHandler(async (ctx: any) => {
    const { nombre, telefono, instagram, nota } = ctx.request.body || {};
    ctx.send({
      data: await createCrmService(strapi).createManual(
        actorFrom(ctx),
        {
          nombre,
          telefono: telefono || '',
          instagram: instagram || '',
          nota: nota || '',
        },
        slugFrom(ctx)
      ),
    });
  }),

  ingest: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).ingest(
        actorFrom(ctx),
        ctx.request.body.payload,
        slugFrom(ctx)
      ),
    });
  }),

  updateContacto: asyncHandler(async (ctx: any) => {
    const data = await createCrmService(strapi).updateContacto(
      actorFrom(ctx),
      ctx.params.documentId,
      ctx.request.body || {},
      slugFrom(ctx)
    );
    ctx.send({ data });
  }),

  updatePlantilla: asyncHandler(async (ctx: any) => {
    const { mensaje, firma, prompt_ia } = ctx.request.body || {};
    ctx.send({
      data: await createCrmService(strapi).updatePlantilla(
        actorFrom(ctx),
        {
          mensaje,
          firma: firma || '',
          prompt_ia,
        },
        slugFrom(ctx)
      ),
    });
  }),

  enviarWhatsapp: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).enviarWhatsapp(
        actorFrom(ctx),
        ctx.request.body.contactoDocumentId,
        slugFrom(ctx)
      ),
    });
  }),

  crearFicha: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).crearFicha(
        actorFrom(ctx),
        ctx.request.body.contactoDocumentId,
        ctx.request.body.categoriaId,
        slugFrom(ctx)
      ),
    });
  }),

  listAlcanzados: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).listAlcanzados(actorFrom(ctx), slugFrom(ctx)),
    });
  }),

  limpiarCola: asyncHandler(async (ctx: any) => {
    ctx.send({
      data: await createCrmService(strapi).limpiarCola(actorFrom(ctx), slugFrom(ctx)),
    });
  }),

  prestar: asyncHandler(async (ctx: any) => {
    const { nombre, owner_email, slug } = ctx.request.body || {};
    ctx.send({
      data: await createCrmService(strapi).prestar(actorFrom(ctx), {
        nombre,
        owner_email,
        slug,
      }),
    });
  }),
});
