import type { Core } from '@strapi/strapi';
import { requireEnvArray } from './required-env';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: requireEnvArray(env, 'APP_KEYS'),
  },
});

export default config;
