import type { Core } from '@strapi/strapi';
import { requireEnv } from './required-env';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: requireEnv(env, 'ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: requireEnv(env, 'API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: requireEnv(env, 'TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: requireEnv(env, 'ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});

export default config;
