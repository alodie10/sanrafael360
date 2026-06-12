# Tareas de Migración a WhatsApp Cloud API

- [ ] 1. Configurar entorno y dependencias.
  - [x] Crear lista de tareas.
  -[x] Añadir `dotenv` y `axios` al `package.json` de la campaña.
  - [x] Crear archivo `.env.example` con las variables de Meta.
- [x] 2. Desarrollar `meta_bot.js`.
  - [x] Implementar lectura del CSV y de `enviados.json`.
  - [x] Crear función POST para la API de Graph `v19.0`.
  - [x] Implementar pausas y manejo de límites de tasa (rate limiting).
- [ ] 3. Configuración en Meta (Lado del Usuario).
  - [ ] Crear App en Meta for Developers.
  - [ ] Registrar número telefónico.
  - [ ] Crear y aprobar plantilla de marketing.
- [ ] 4. Pruebas y Validación.
  - [ ] Probar envío al número del desarrollador/propietario.
  - [ ] Reanudar envíos a los 98 contactos restantes de `curada.csv`.
