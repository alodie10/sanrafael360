import { factories } from '@strapi/strapi';
import { asyncHandler } from '../../../utils/asyncHandler';
import { getDisponibilidad } from '../services/disponibilidad';

export default factories.createCoreController(
  'api::reserva-comercio.reserva-comercio',
  ({ strapi }) => ({
    disponibilidad: asyncHandler(async (ctx) => {
      const { slug } = ctx.params;
      const fecha = typeof ctx.query.fecha === 'string' ? ctx.query.fecha : undefined;
      const dias = ctx.query.dias !== undefined ? Number(ctx.query.dias) : 1;
      const data = await getDisponibilidad(strapi, slug, { fecha, dias });
      ctx.send({ data });
    }),
  })
);
