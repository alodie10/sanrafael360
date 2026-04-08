# Configuración de Seguridad y Permisos (Strapi)

Este documento detalla los permisos críticos necesarios para el correcto funcionamiento del Portal de Anunciante y el sistema de reclamos.

## Roles y Permisos (Plugin Users-Permissions)

### Rol: `Authenticated`
Este rol es asignado a cualquier usuario que haya iniciado sesión en la plataforma. Debe tener activos los siguientes permisos para interactuar con la API de Negocios:

| Endpoint (Action) | Descripción | Justificación |
| :--- | :--- | :--- |
| `api::negocio.negocio.me` | GET /api/negocios/me | Permite al usuario ver sus propios negocios vinculados. |
| `api::negocio.negocio.claim` | POST /api/negocios/:id/claim | Permite iniciar el proceso de reclamo de un local. |
| `api::negocio.negocio.find` | GET /api/negocios | Necesario para la navegación general del directorio. |
| `api::negocio.negocio.findOne` | GET /api/negocios/:slug | Necesario para ver el detalle del negocio. |

### Rol: `Public`
| Endpoint (Action) | Descripción | Justificación |
| :--- | :--- | :--- |
| `api::negocio.negocio.find` | GET /api/negocios | Navegación anónima del sitio. |
| `api::negocio.negocio.findOne` | GET /api/negocios/:slug | Ver detalles de negocios sin loguearse. |

## Vinculación de Propiedad (Ownership)

La relación de propiedad se gestiona mediante el campo `owner` en la colección `Negocio`.
- **Target:** `plugin::users-permissions.user`
- **Tipo:** One-to-One (o Many-to-One si el usuario tiene varios locales).

## Automatización (Bootstrap)

Los permisos se refuerzan automáticamente al arrancar la aplicación en `backend/src/index.ts`. Si por alguna razón se pierden en el Panel de Administración de Strapi, reiniciar el servidor en Railway volverá a inyectar estos permisos en la base de datos de producción.

## Solución de Problemas (Acceso Denegado 403)

Si un usuario recibe un 403 al entrar al portal:
1. Verificar que el token JWT sea válido.
2. Asegurarse de que el endpoint `/api/negocios/me` esté registrado en las rutas del backend.
3. Confirmar que el `bootstrap` de permisos se ejecutó correctamente revisando los logs de Railway.
