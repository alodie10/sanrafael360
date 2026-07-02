
export default {
  routes: [
    {
      method: 'POST',
      path: '/negocios/register-cloudinary',
      handler: 'media-restorer.registerCloudinary',
      config: {
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
  ],
};
