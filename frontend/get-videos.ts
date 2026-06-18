import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // We can't easily query strapi from prisma if we don't have the models, but maybe we can just query the endpoint:
  const res = await fetch("http://localhost:3000/api/negocios/bosque-comestible");
  // Oh wait, the backend runs on port 1337.
  // We can just use the frontend API proxy or Strapi directly.
}
main();
