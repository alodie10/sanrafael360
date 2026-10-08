# SDD-0002 — Mail en el CRM de captación

| Campo | Valor |
| --- | --- |
| Estado | Implemented |
| Responsable | Diego Alonso |
| Fecha | 2026-10-07 |
| Tarea o commit relacionado | Rama `develop` |
| Reemplaza / reemplazado por | |

## Problema y resultado

### Problema

En `/portal/crm` un contacto se aborda por WhatsApp: el sistema guarda el teléfono, arma el mensaje de la campaña y abre `wa.me`. No hay correo en el contacto ni una acción para enviarle mail con el mismo mensaje.

### Resultado buscado

El contacto puede tener un mail. En la cola y en el lote hay un botón Mail que abre en Mail un HTML con la estética del sitio y la imagen hosteada de la pieza. Al enviarlo queda en Enviados. El envío queda en Contactos alcanzados y consume un cupo diario de mail, separado del de WhatsApp.

## Alcance

### Incluido

- Campo `email` en el contacto, en el alta manual y en el JSON de la IA.
- Botón Mail junto a WhatsApp, en la cola y en el lote de otra campaña.
- Borrador HTML en Mail, negro y oro, con el texto de la campaña, la firma y la imagen `https` de la pieza. El asunto es el título de la campaña. Al enviarlo queda en Enviados.
- Actividad `envio_email`, salida de la cola y estado `contactado` cuando el mail es válido.
- Cuenta diaria de mail, sin tope. El contador es propio y no frena el botón.
- Si el mail no es válido, el contacto sale de la cola sin consumir cupo.
- Los envíos de mail entran en Contactos alcanzados.
- El aviso de contacto reciente aplica también antes de abrir el mail.
- El prompt por defecto pide `email`. Si un tenant todavía tiene el texto exacto del prompt viejo, se actualiza a ese default.
- Crear ficha se habilita con nombre, categoría y teléfono o mail. El mail queda en la ficha.

### Fuera de alcance

- Cambiar Places, Prospección, Crear negocio o Interesados.
- Un estado de error distinto de `error`.
- Editar el mail de un contacto ya cargado desde la cola.
- Promoción a producción.

### Supuestos y dependencias

- El borrador se abre en Mail en esta Mac. El cupo se descuenta al abrirlo. Si Mail no abre, el contacto sigue en la cola.
- El mail no tiene tope. La cuenta del día sigue en `cupo_mail_count`. WhatsApp sigue con `cupo_wsp_limite`.
- En modo guía, Mail se habilita con ficha publicada, igual que WhatsApp. En modo agenda no hace falta ficha.
- El trabajo queda en la rama `develop`.

## Requisitos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| REQ-001 | Un contacto nuevo puede guardarse con mail, por alta manual o por JSON. Un mail repetido en el mismo tenant se trata como duplicado, igual que un teléfono repetido. | Must |
| REQ-002 | Si el correo es válido, Mail abre un borrador HTML con el texto de la campaña, la estética negro y oro y la imagen hosteada de la pieza. El asunto es el título de la campaña. Al enviarlo queda en Enviados. | Must |
| REQ-003 | Mail respeta no contactar, exige ficha en modo guía, saca el contacto de la cola y lo pasa a contactado solo si el borrador se abrió, y consume cupo de mail solo en ese caso. | Must |
| REQ-004 | Un mail inválido saca el contacto de la cola, no consume cupo y avisa para marcarlo Error. | Must |
| REQ-005 | Marcar `error` el mismo día devuelve 1 del cupo de mail si ese contacto consumió cupo de mail hoy. El cupo de WhatsApp no se mezcla. | Must |
| REQ-006 | Contactos alcanzados incluye envíos de mail y de WhatsApp. El aviso de envío reciente aparece también al pulsar Mail. | Must |
| REQ-007 | El prompt por defecto incluye `email`. WhatsApp solo se habilita si el teléfono arma `wa.me`. Si no hay teléfono usable, el botón queda apagado y el contacto sigue en la cola. | Must |

## Criterios de aceptación

| ID | Escenario / condición de pasa | Evidencia requerida | Resultado |
| --- | --- | --- | --- |
| AC-001 | **Dado** un alta manual o un JSON con `email` **Cuando** se carga el contacto **Entonces** el mail queda guardado y un segundo ítem con el mismo mail es duplicado. | Test unitario de ingest y revisión del alta. | Pasa en unitarios. Falta el alta en el navegador. |
| AC-002 | **Dado** un contacto con mail válido, pieza con imagen `https` y cupo disponible **Cuando** se pulsa Mail **Entonces** Mail abre el borrador HTML con esa imagen, el contacto sale de la cola como contactado y el cupo de mail suma 1. Al enviar el borrador queda en Enviados. | Test del HTML y prueba en Mail. | Pasa el HTML. Falta el clic en el portal. |
| AC-003 | **Dado** un mail vacío o inválido **Cuando** se intenta el envío **Entonces** sale de la cola, el cupo de mail no cambia y hay aviso. | Test unitario. | Pasa |
| AC-004 | **Dado** modo guía sin ficha, o `no_contactar` **Cuando** se intenta Mail **Entonces** no se abre el envío. Un conteo alto de mails del día no frena el botón. | Test unitario de las guardas. | Pasa en unitarios. |
| AC-005 | **Dado** un mail enviado hoy **Cuando** el estado pasa a `error` **Entonces** el cupo de mail baja 1 y el de WhatsApp no. | Test unitario del cupo. | Pasa |
| AC-006 | **Dado** actividades de WhatsApp y de mail **Cuando** se abre Contactos alcanzados **Entonces** ambos envíos aparecen y, si el último tiene menos de un mes, Mail pide confirmación. | Test de plegado y revisión de la UI. | Pasa el plegado. Falta ver la lista en el navegador. |
| AC-007 | **Dado** el prompt default anterior, texto exacto **Cuando** carga el tenant **Entonces** el prompt pasa a pedir `email`. Un WhatsApp válido sigue abriendo `wa.me` y consumiendo solo su cupo. Sin teléfono usable el botón queda apagado. | Test del prompt y de la guarda de teléfono. | Pasa el prompt y la guarda. |

## Restricciones e invariantes

- Capas de `STANDARDS.md`: validación en middleware, orquestación en el controlador con `asyncHandler`, reglas en servicios y funciones puras, persistencia en el repositorio.
- No se modifican rutas públicas, CORS ni CSP.
- El contenido ya publicado de la guía no cambia. El alta de ficha desde la cola sigue igual.
- Places, Prospección, Crear negocio e Interesados no cambian de comportamiento.
- El esquema suma campos y valores de enumeración. No se borran contactos ni actividades.
- WhatsApp sigue siendo `wa.me`. El mail de captación es un borrador HTML en Mail.
- La rama de trabajo es `develop`. No hay push a `master`.

## Impacto y camino de llamada

- Entrada: `POST /api/crm/contactos`, `POST /api/crm/ingestar`, `POST /api/crm/enviar-mail`, `GET /api/crm/bootstrap`, `GET /api/crm/alcanzados`.
- Camino de mail: ruta → `crm-enviar-validator` → controlador → `enviarMail` → repositorio y actividad.
- Archivos: esquemas `crm-contacto`, `crm-actividad` y `crm-comercio`; servicio, repositorio, cupo, ingest, defaults, UI de `/portal/crm`.
- Contrato nuevo: la respuesta de mail incluye `enviado`, `texto`, `cupoMail`, `aviso` y `contacto`. Bootstrap incluye `cupoMail`.

## Plan de verificación

### Checks del agente

- Revisión estática de los archivos del cambio.
- Tests unitarios de ingest, `mailto:`, cupo de mail, plegado de alcanzados y prompt.
- Typecheck del backend en los archivos tocados, si el proyecto lo permite sin levantar Strapi.
- Flujo en el navegador si hay sesión local del portal.

### Checks de Diego

- En local, pulsar Mail, enviar el borrador y confirmar que queda en Enviados con la imagen de la pieza.
- Confirmar que un WhatsApp del mismo día sigue descontando solo el cupo de WhatsApp.
- Content Manager: los campos nuevos aparecen después de reiniciar Strapi en desarrollo.

### Comparación de performance, si aplica

- No aplica.

## Trazabilidad

| Requisito o criterio | Dónde se implementa | Evidencia | Estado |
| --- | --- | --- | --- |
| REQ-001 / AC-001 | `crm-ingest.ts`, `crm-repository.ts`, `CrmManualForm.tsx` | `crm-ingest.test.ts` | Pasa. Falta el alta en el navegador. |
| REQ-002 / AC-002 | `crm-mail-html.ts`, `enviarMail`, botón Mail | `crm-mail-html.test.ts` | Pasa el HTML. Falta el clic en el portal. |
| REQ-003 / AC-003 / AC-004 | `crm-enviar.ts`, `crm-cupo.ts`, `crm-service.ts` | `crm-enviar.test.ts`, `crm-cupo.test.ts` | Pasa |
| REQ-005 / AC-005 | `resumenCupoMailActividades`, `refundCupoMailSiErrorHoy` | `crm-cupo.test.ts` | Pasa |
| REQ-006 / AC-006 | `crm-alcanzados.ts`, `CrmPilotClient.tsx` | `crm-alcanzados.test.ts` | Pasa el plegado. Falta la pantalla. |
| REQ-007 / AC-007 | `crm-defaults.ts`, `ensurePlantilla` | `crm-prompt.test.ts`, `crm-cupo.test.ts` | Pasa |

## Decisiones y preguntas abiertas

- CRM-DEC-018: el mail es un borrador HTML en Mail para que, al enviarlo, quede en Enviados. El cupo de mail sigue siendo independiente del de WhatsApp.
- Pregunta abierta: ninguna para este alcance.

## Historial

| Fecha | Cambio | Motivo |
| --- | --- | --- |
| 2026-10-07 | Aprobado e implementación pedida | Diego pidió incorporar mail y poder enviarlo, en desarrollo, con el mismo lugar que hoy tiene WhatsApp. |
| 2026-10-07 | Implementado en `develop` | 57 tests unitarios de CRM en verde. Falta el clic en el portal con Strapi local reiniciado. |
| 2026-10-07 | El mail pasa a HTML | El `mailto:` era texto plano y no mostraba la imagen hosteada de la pieza. |
| 2026-10-07 | El HTML se abre en Mail | El envío por el servicio de email no aparecía en Enviados. |
