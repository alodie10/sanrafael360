import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '1337', 10),
  url: process.env.PUBLIC_URL || 'https://api.sanrafael360.com',
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default config;
