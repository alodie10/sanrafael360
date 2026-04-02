
export default {
  routes: [
    {
      method: 'POST',
      path: '/negocios/register-cloudinary',
      handler: 'media-restorer.registerCloudinary',
      config: {
        auth: false, // We'll use the API Token for manual security or just public access temporarily
        policies: [],
        middlewares: [],
      },
    },
  ],
};
