async function run() {
  try {
    const roles = await strapi.service('plugin::users-permissions.role').find();
    const publicRole = roles.find(r => r.type === 'public');

    if (!publicRole) {
      console.error('❌ No se encontró el rol público.');
      return;
    }

    const permissions = [
      'api::negocio.negocio.find',
      'api::negocio.negocio.findOne',
      'api::categoria.categoria.find',
      'api::categoria.categoria.findOne',
      'api::review.review.find',
      'api::review.review.findOne',
      'api::actividad.actividad.find'
    ];

    console.log(`🔑 Otorgando permisos al rol Público (ID: ${publicRole.id})...`);

    for (const action of permissions) {
      try {
        await strapi.service('plugin::users-permissions.role').updateRole(publicRole.id, {
          permissions: {
            [action.split('.').slice(0, 3).join('.')]: {
              controllers: {
                [action.split('.')[2]]: {
                  [action.split('.')[3]]: { enabled: true }
                }
              }
            }
          }
        });
        console.log(`✅ Permiso otorgado: ${action}`);
      } catch (err) {
        // En Strapi 5 la estructura de permisos puede variar un poco, intentamos modo directo si falla
        console.log(`⚠️  Error al asignar ${action}, intentando vía query...`);
        try {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action, role: publicRole.id }
          });
          console.log(`✅ Permiso otorgado vía query: ${action}`);
        } catch (innerErr) {
          console.log(`ℹ️  ${action} ya existe o falló: ${innerErr.message}`);
        }
      }
    }

    console.log('✨ Configuración de permisos finalizada.');
  } catch (error) {
    console.error('❌ Error fatal:', error);
  }
}

run();
