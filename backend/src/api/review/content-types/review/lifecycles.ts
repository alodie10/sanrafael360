export default {
  // Desactivamos todo por un momento para ver si Strapi guarda la reseña base
  /*
  async beforeCreate(event: any) {
     // ... validación desactivada ...
  },
  */

  async afterCreate(event: any) {
    const { result } = event;
    // Sincronización básica de rating
    try {
       // Solo intentamos sincronizar si tenemos los datos básicos
       strapi.log.info(`[Review] Nueva reseña detectada: ${result.id}`);
    } catch (e) {}
  }
};
