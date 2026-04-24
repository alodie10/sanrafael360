
module.exports = async ({ strapi }) => {
  const authService = strapi.service('plugin::users-permissions.auth');
  const pluginService = strapi.plugin('users-permissions').service('auth');
  
  console.log('--- Diagnóstico de Servicios ---');
  console.log('strapi.service("plugin::users-permissions.auth"):', !!authService);
  if (authService) console.log('Métodos disponibles:', Object.keys(authService));
  
  console.log('strapi.plugin("users-permissions").service("auth"):', !!pluginService);
  if (pluginService) console.log('Métodos disponibles:', Object.keys(pluginService));
  console.log('-------------------------------');
};
