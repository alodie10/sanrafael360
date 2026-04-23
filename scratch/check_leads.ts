import { strapi } from '@strapi/strapi';

async function checkLeads() {
  const leads = await strapi.documents('api::lead.lead').findMany({
    sort: 'createdAt:desc',
    limit: 1
  });
  console.log('--- LEADS ENCONTRADOS ---');
  console.log(JSON.stringify(leads, null, 2));
}

checkLeads();
