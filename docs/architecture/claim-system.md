# Sistema de Reclamos de Negocios (Claim System)

Este documento detalla la arquitectura y las decisiones técnicas tomadas para implementar el flujo de reclamos de perfiles comerciales en San Rafael 360.

## Decisión Técnica: `strapi.query` vs `documents` API

A partir de la versión 1.1.0 del sistema de reclamos, se ha optado por utilizar **`strapi.query`** (Database Query Engine) en lugar del nuevo servicio `strapi.documents` introducido en Strapi 5 para la lógica de los controladores personalizados.

### Razón de la Decisión
1. **Estabilidad en Relaciones Complejas:** La API de `documents` de Strapi 5, aunque moderna, presentó comportamientos inconsistentes y errores 500 al intentar vincular entidades con el plugin `users-permissions` (Usuarios). `strapi.query` es el motor de base de datos de bajo nivel, lo que garantiza una compatibilidad del 100% con modelos de datos heredados o críticos.
2. **Control de Draft & Publish:** Al usar `strapi.query`, evitamos que las actualizaciones de estado de reclamo queden atrapadas en estados de "Draft" inconsistentes si el documento base tiene habilitado el sistema de borrador.
3. **Performance y Latencia:** `strapi.query` ofrece un acceso más directo a las tablas de la base de datos, reduciendo la sobrecarga de validaciones de capa superior que a veces causaban timeouts en entornos como Railway.

## Aislamiento de Servicios (Email)

Para garantizar que el sistema de reclamos sea **resiliente**, el servicio de notificación por correo electrónico se ha implementado bajo el patrón **Fire & Forget**:
- El envío de email ocurre en una promesa asíncrona que **no se espera (`await`)**.
- Está envuelto en su propio bloque `try/catch`.
- **Garantía:** Un fallo en el servidor SMTP o una configuración de email incorrecta nunca impedirá que el reclamo quede guardado en la base de datos de Strapi ni bloqueará la respuesta 200 OK al cliente.

## UX y Manejo de Estados
En el frontend, el sistema utiliza un bloque `try...catch...finally` estricto que asegura que el estado `isClaiming` se resetee invariablemente. Esto evita que el botón de envío quede bloqueado en estado "Enviando..." si ocurre un fallo en la red o un error 500 inesperado.
