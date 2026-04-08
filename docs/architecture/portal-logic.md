# Lógica del Portal de Anunciantes y Visibilidad de Borradores

Este documento explica el diseño técnico detrás de la visibilidad de los negocios en el portal privado del usuario, garantizando la seguridad y la correcta gestión de los estados de publicación.

## Arquitectura: Endpoint `/api/negocios/me`

Para el portal de anunciantes, hemos implementado un endpoint personalizado en lugar de utilizar los filtros estándar de la API REST de Strapi.

### Por qué un endpoint personalizado?
1. **Seguridad y Aislamiento:** El motor REST de Strapi filtra automáticamente los boradores (`drafts`) para usuarios no administrativos. Al usar un endpoint propio que utiliza `strapi.query`, podemos recuperar los negocios en cualquier estado de publicación de forma segura, validando que el `owner` coincida con el usuario que realiza la petición.
2. **Evitar Errores 400:** La API de Strapi 5 restringe el uso del parámetro `status=draft` a usuarios con permisos de edición de backend. Al centralizar la lógica en el servidor, el frontend no necesita enviar parámetros que Strapi podría rechazar, eliminando errores de sintaxis o de permisos.
3. **Mantenimiento:** Si en el futuro cambiamos la forma en que se vinculan los negocios a los usuarios, solo necesitamos actualizar el controlador en el servidor, sin tocar múltiples llamadas en el frontend.

## Decisión de Seguridad: No Autopublicar

Durante el flujo de reclamo (Claim Business), el sistema realiza las siguientes acciones:
1. Vincula al usuario con el negocio mediante el campo `owner`.
2. Establece el `estado_reclamo` como `pendiente`.
3. **Mantiene el negocio en estado de Borrador (Draft).**

### Justificación
- **Moderación:** Evitamos que un usuario malintencionado reclame un negocio legítimo y cambie su información de forma instantánea y pública. 
- **Verificación Humana:** El negocio solo aparecerá como "Aprobado" y "Publicado" después de que un administrador revise la validez del reclamo en el panel de Strapi.
- **Transparencia:** El usuario puede ver su negocio en su portal inmediatamente con el badge de "Revisión pendiente", pero el público general seguirá viendo la versión original (o ninguna, si era un negocio nuevo) hasta la aprobación.

## Flujo de Datos
1. `Frontend` -> `GET /api/negocios/me` (incluye JWT).
2. `Backend` -> Valida usuario.
3. `Backend` -> Query a DB donde `owner == user.id`.
4. `Backend` -> Devuelve lista de negocios (inc. drafts).
5. `Frontend` -> Renderiza tarjetas con badges de estado basados en `estado_reclamo`.
