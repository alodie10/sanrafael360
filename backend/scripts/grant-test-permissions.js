async function grant() {
  const roles = await strapi.service('plugin::users-permissions.role').find();
  const publicRole = roles.find(r => r.type === 'public');
  const authRole = roles.find(r => r.type === 'authenticated');

  for (const role of [publicRole, authRole]) {
    if (!role) continue;
    try {
      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: 'api::negocio.negocio.resetClaimForTest',
          role: role.id,
        }
      });
      console.log('✅ Success for ' + role.type);
    } catch (e) {
      console.log('ℹ️ Already exists for ' + role.type);
    }
  }
}
grant();
