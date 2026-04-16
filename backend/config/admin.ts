import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'sr360_admin_jwt_secret_v1_fallback'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'sr360_api_token_salt_v1_fallback'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'sr360_transfer_token_salt_v1_fallback'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY', 'sr360_encryption_key_v1_fallback'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});

export default config;
