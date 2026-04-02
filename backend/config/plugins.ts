
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME', 'dg0msu8ru'),
        api_key: env('CLOUDINARY_KEY', '517598867933172'),
        api_secret: env('CLOUDINARY_SECRET', '6frfOJz7L7V_x-GEjttlfkibYRQ'),
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
      jwtSecret: env('JWT_SECRET', 'a_very_secure_random_secret_fallback_123'),
    },
  },
});
