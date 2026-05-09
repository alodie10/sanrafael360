
const { createStrapi } = require('@strapi/strapi');

async function createAdmin() {
  const app = await createStrapi().load();
  
  const adminService = app.admin.services.user;
  const roleService = app.admin.services.role;

  try {
    const superAdminRole = await roleService.findOne({ code: 'strapi-super-admin' });
    
    if (!superAdminRole) {
      console.error('❌ No se encontró el rol de Super Admin');
      process.exit(1);
    }

    const newUser = await adminService.create({
      email: 'admin@test.com',
      firstname: 'Admin',
      lastname: 'Local',
      password: 'SanRafael2026!',
      roles: [superAdminRole.id],
      isActive: true,
      registrationToken: null,
    });

    console.log('✅ Administrador de emergencia creado exitosamente:');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Clave: SanRafael2026!');
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('unique constraint')) {
      console.log('ℹ️ El usuario admin@test.com ya existe.');
    } else {
      console.error('❌ Error al crear admin:', err.message);
    }
  }

  process.exit(0);
}

createAdmin();
