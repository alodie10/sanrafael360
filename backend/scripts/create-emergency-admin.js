
const { createStrapi } = require('@strapi/strapi');

async function createAdmin() {
  if (process.env.NODE_ENV === 'production') {
    console.error('create-emergency-admin no corre en production.');
    process.exit(1);
  }

  const email = process.env.EMERGENCY_ADMIN_EMAIL?.trim();
  const password = process.env.EMERGENCY_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Faltan EMERGENCY_ADMIN_EMAIL y EMERGENCY_ADMIN_PASSWORD.');
    process.exit(1);
  }

  const app = await createStrapi().load();
  const adminService = app.admin.services.user;
  const roleService = app.admin.services.role;

  try {
    const superAdminRole = await roleService.findOne({ code: 'strapi-super-admin' });
    if (!superAdminRole) {
      console.error('No se encontró el rol de Super Admin');
      process.exit(1);
    }

    await adminService.create({
      email,
      firstname: 'Admin',
      lastname: 'Local',
      password,
      roles: [superAdminRole.id],
      isActive: true,
      registrationToken: null,
    });

    console.log(`Administrador de emergencia creado: ${email}`);
  } catch (err) {
    const message = err?.message || String(err);
    if (message.includes('already exists') || message.includes('unique constraint')) {
      console.log(`El usuario ${email} ya existe.`);
    } else {
      console.error('Error al crear admin:', message);
    }
  }

  process.exit(0);
}

createAdmin();
