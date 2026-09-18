# Decisiones del módulo CRM

Numeración **CRM-DEC-…**.

### 2026-09-17 — CRM-DEC-001 — Tenant 0 = SR360
- **Contexto:** Productizar la mesa de Diego, no un CRM en blanco.
- **Decisión:** El primer comercio del módulo es San Rafael 360 (`slug: sr360`).
- **Qué se descartó:** Empezar por un taller o salón.

### 2026-09-17 — CRM-DEC-002 — Paralelo sin interferencia
- **Contexto:** Diego usa Places, Prospección, Alta e Interesados todos los días.
- **Decisión:** Fase A solo escribe `crm-*`. Cupo CRM ≠ cupo `prospeccion-plantilla`. Cero cambios de comportamiento en esas cuatro UIs.
- **Qué se descartó:** Facade que mute leads/negocios; dual-write al 25 de producción.

### 2026-09-17 — CRM-DEC-003 — IA afuera + prompt en el módulo
- **Contexto:** Grok (u otra) arma listas de abordaje por fuera.
- **Decisión:** Prompt copiable + pegar JSON. Alta manual también. Sin API de modelos.
- **Qué se descartó:** Parser “adivina cualquier dump”; webhook a Grok.

### 2026-09-17 — CRM-DEC-004 — wa.me sin Enter
- **Contexto:** Probar el flujo sin mandar WhatsApp.
- **Decisión:** El CRM abre/arma `wa.me`. El conteo de pruebas vive en `crm-comercio`. Enter lo da el humano.
- **Qué se descartó:** Dry-run aparte; gastar el 25 de Prospección en tests.

### 2026-09-17 — CRM-DEC-005 — Corte explícito
- **Contexto:** No recablear en silencio.
- **Decisión:** Ocultar las cuatro pestañas solo cuando el CRM ya cubra Places, Prospección, Alta e Interesados. Flag `CRM_CORTE_NAV`. Revertir = `false`.
- **Qué se descartó:** Borrar los módulos viejos.

### 2026-09-17 — CRM-DEC-006 — No cortar el nav sin adaptadores
- **Contexto:** Ocultar el nav sin Places → ficha (etc.) deja a Diego sin mesa de trabajo.
- **Decisión:** El CRM convive. Las cuatro pestañas siguen. Places → `negocio` desde el CRM sigue apagado.
- **Qué se descartó:** Encender dual-write o apagar el nav “por las dudas”.

### 2026-09-17 — CRM-DEC-007 — SaaS: primero SR360, después clientes
- **Contexto:** Diego usa el CRM en su negocio. Si rinde, se vende a comercios que lo contraten.
- **Decisión:** Cada cliente futuro tiene su propia cuenta (contactos y cupo aislados). No comparte la guía ni las 700 fichas. La pantalla de hoy es solo San Rafael 360; el alta de clientes no se muestra todavía.
- **Qué se descartó:** “Prestar” el CRM como favor; mezclar listas entre comercios.

### 2026-09-17 — CRM-DEC-008 — Revertir corte prematuro
- **Contexto:** Se ocultaron las cuatro pestañas con el CRM todavía sin Importar Places ni el resto.
- **Decisión:** `CRM_CORTE_NAV = false`. Producción de captación restaurada. El CRM queda en `/portal/crm` en paralelo.
- **Qué se descartó:** Dejar el nav vacío hasta “completar el CRM”.

### 2026-09-18 — CRM-DEC-009 — Ficha mínima desde la cola
- **Contexto:** El contacto encolado no aparecía en la guía.
- **Decisión:** En la cola se elige categoría. Con nombre + teléfono + categoría, **Crear ficha** usa el mismo alta simple que Crear negocio (`published`, `reclamar_habilitado`). El dueño se busca y ve el invite a suscribirse. Places / Prospección / Crear negocio no se tocan.
- **Qué se descartó:** Convertir en silencio al pasar a “ganado”; publicar fichas desde un cliente SaaS.

### 2026-09-18 — CRM-DEC-010 — Cola ≠ pipeline ≠ historial
- **Contexto:** Crear ficha marcaba el contacto como `ganado`. No había forma de vaciar la cola sin perder el rastro de WhatsApp.
- **Decisión:** Crear ficha solo enlaza categoría + negocio; el estado lo cambia Diego. **Limpiar cola** oculta con `en_cola: false` y no borra. **Contactos alcanzados** se arma con `crm-actividad` `envio_whatsapp`, igual que Prospección.
- **Qué se descartó:** Borrar contactos; usar `ganado` como señal de ficha publicada.

### 2026-09-18 — CRM-DEC-011 — Error WSP y pipeline a mano
- **Contexto:** Un `wa.me` puede fallar (número inválido). Diego necesita marcar eso, filtrar leads y dejar un comentario, y a veces devolverlos a Nuevo.
- **Decisión:** Estado `error` (manual). Filtro por estado y/o fecha. Comentario = `nota`. Volver a `nuevo` reencola (`en_cola: true`).
- **Qué se descartó:** Detectar el error de WhatsApp en automático; bloquear el paso a Nuevo.
