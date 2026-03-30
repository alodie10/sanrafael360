import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: process.env.HOST || '0.0.0.0',
  port: (process.env.PORT || 1337) as unknown as number,
  url: 'https://api.sanrafael360.com',
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default config;
