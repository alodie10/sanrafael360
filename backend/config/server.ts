import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  url: env('URL', 'https://sanrafael360-production.up.railway.app'),
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true, // Crucial for Railway with a custom domain/SSL
  app: {
    keys: env.array('APP_KEYS', ['sr360_app_key_1_fallback', 'sr360_app_key_2_fallback']),
  },
});

export default config;
