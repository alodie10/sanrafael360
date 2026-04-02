
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'local', // DESACTIVADO TEMPORALMENTE PARA EVITAR CRASHES EN RESTAURACIÓN
      /* 
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {
           breakpoints: false // No generar tamaños extra para evitar 502
        },
        delete: {},
      },
      */
    },
  },
});
