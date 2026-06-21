const strapi = require('@strapi/strapi');
strapi().start().then(async app => {
  await require('./test-findone.js')(app);
  process.exit(0);
});
