export default {
  config: {
    locales: ['es'],
  },
  bootstrap(app: any) {
    // Parche de Emergencia: Evita el crash 'reading tours' en el Content Manager
    app.registerPlugin({
      id: 'guided-tours',
      initializer: () => ({ tours: {} }),
    });
    console.log('Admin UI Reset to Standard - tours fixed');
  },
};
