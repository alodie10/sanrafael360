const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function sync() {
  const client = new Client({
    connectionString: 'postgres://strapi:strapi@localhost:5432/strapi'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const hash = await bcrypt.hash('DcaDca_0111#', 10);
    const email = 'diegocristianalonso@gmail.com';

    // 1. Asegurar que el usuario existe y tiene la contraseña correcta
    const userRes = await client.query("SELECT id FROM up_users WHERE email = $1", [email]);
    
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      await client.query("UPDATE up_users SET password = $1 WHERE id = $2", [hash, userId]);
      console.log('Password updated for existing user.');
    } else {
      const insertRes = await client.query(
        "INSERT INTO up_users (username, email, password, confirmed, blocked, provider) VALUES ('diego', $1, $2, true, false, 'local') RETURNING id",
        [email, hash]
      );
      userId = insertRes.rows[0].id;
      console.log('New user created.');
    }

    // 2. Asegurar que tiene el rol de Admin (ID del rol 7 según log anterior)
    const roleRes = await client.query("SELECT id FROM up_roles WHERE name = 'Admin'");
    if (roleRes.rows.length > 0) {
      const roleId = roleRes.rows[0].id;
      await client.query("DELETE FROM up_users_role_lnk WHERE user_id = $1", [userId]);
      await client.query("INSERT INTO up_users_role_lnk (user_id, role_id) VALUES ($1, $2)", [userId, roleId]);
      console.log('Role Admin synced successfully.');
    }
    
    console.log('SYNC COMPLETE');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}

sync();
