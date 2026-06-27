const fs = require('fs');

async function test() {
  const strapi = require('@strapi/strapi')();
  await strapi.load();
  
  const permissions = await strapi.db.query('plugin::users-permissions.permission').findMany();
  let undefinedActions = permissions.filter(p => !p.action);
  console.log("Permissions with undefined action:", undefinedActions.length);
  
  process.exit(0);
}

test().catch(console.error);
