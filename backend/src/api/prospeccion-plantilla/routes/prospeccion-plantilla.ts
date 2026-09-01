import { factories } from '@strapi/strapi';

/** Sin REST público; el panel usa rutas admin en api::prospeccion. */
export default factories.createCoreRouter(
  'api::prospeccion-plantilla.prospeccion-plantilla' as any,
  { only: [], config: {} }
);
