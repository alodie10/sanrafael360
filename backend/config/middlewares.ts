import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
            'sanrafael360-production.up.railway.app',
            'sanrafael360.vercel.app',
            '*.vercel.app'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
            'sanrafael360-production.up.railway.app',
            'sanrafael360.vercel.app',
            '*.vercel.app'
          ],
          upgradeInsecureRequests: null,
        },
      },
      crossOriginResourcePolicy: 'cross-origin',
      crossOriginEmbedderPolicy: false,
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
