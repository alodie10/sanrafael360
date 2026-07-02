import { requireEnv } from './required-env';

export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: requireEnv(env, 'CLOUDINARY_NAME'),
        api_key: requireEnv(env, 'CLOUDINARY_KEY'),
        api_secret: requireEnv(env, 'CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {
           breakpoints: false 
        },
        delete: {},
      },
    },
  },
  'users-permissions': {
    config: {
      jwtSecret: requireEnv(env, 'JWT_SECRET'),
    },
  },
  email: {
    config: {
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: requireEnv(env, 'RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: env('RESEND_DEFAULT_FROM', 'no-reply@sanrafael360.com'),
        defaultReplyTo: env('RESEND_DEFAULT_REPLY_TO', 'admin@sanrafael360.com'),
      },
    },
  },
});
