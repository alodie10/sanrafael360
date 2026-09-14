import { factories } from '@strapi/strapi';

/** Core write cerrado: altas/edits solo por portal-update y rutas admin. */
export default factories.createCoreRouter('api::negocio.negocio', {
  except: ['create', 'update', 'delete'],
});
