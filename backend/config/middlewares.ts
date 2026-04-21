import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'global::errorHandler',
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
            '*.vercel.app',
            'sanrafael360.com',
            'www.sanrafael360.com'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
            'sanrafael360-production.up.railway.app',
            'sanrafael360.vercel.app',
            '*.vercel.app',
            'sanrafael360.com',
            'www.sanrafael360.com'
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
      origin: [
        'http://localhost:3000', 
        'https://www.sanrafael360.com', 
        'https://sanrafael360.com',
        'https://sanrafael360.vercel.app',
        /\.vercel\.app$/
      ],
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
