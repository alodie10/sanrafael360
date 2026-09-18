# Alcance MVP — CRM (piloto SR360)

Fecha: **17 de septiembre de 2026**.

## Entra

1. Tenant `sr360` (crm-comercio) con cupo propio.
2. Contactos (`crm-contacto`): alta **manual** y **pegar JSON** de IA.
3. Prompt copiable para cualquier IA (formato JSON fijo).
4. Pipeline: `nuevo` / `contactado` / `en_conversacion` / `error` / `ganado` / `descartado`. Se puede volver a `nuevo`. Filtro por estado y fecha. Comentario en el lead.
5. WhatsApp click-to-chat (`wa.me`). Enter lo da el humano. El sistema registra texto y fecha.
6. Cola entre contactos `nuevo` con teléfono.
7. Opt-out `no_contactar`.
8. Ruta `/portal/crm` al lado de las cuatro pestañas de producción.
9. En la cola: categoría + **Crear ficha** (nombre, teléfono, categoría) → alta mínima publicada, invite a suscribirse. El estado no pasa a `ganado`.
10. **Limpiar cola** oculta los contactos de trabajo; el historial **Contactos alcanzados** queda (envíos WhatsApp).

## Más adelante (no en esta pantalla)

Clientes que contraten el CRM: cada uno su lista y su cupo. Sin la guía ni las 700 fichas. La UI de alta de cliente no está en el piloto; primero lo usás vos.

## Queda fuera

| Ítem | Motivo |
|---|---|
| Ocultar Places / Prospección / Alta / Interesados | El CRM aún no cubre esos flujos |
| Editar esas cuatro UIs o sus APIs | Aislamiento; Diego las usa todos los días |
| Escribir `lead` / `prospeccion-*` | Interferencia |
| API de Grok / ChatGPT | La IA está afuera |
| WhatsApp Business API / Enter automático | ToS y reputación |
| Discovery Places → ficha desde el CRM | Todavía no; es condición del corte |
