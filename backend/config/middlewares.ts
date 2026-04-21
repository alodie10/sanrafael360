import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
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
            '*.up.railway.app',
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
            '*.up.railway.app',
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
      origin: env('CORS_ORIGIN', '*').split(','),
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
