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

### 2026-09-18 — CRM-DEC-012 — Ficha → WhatsApp → sale de la cola
- **Contexto:** Diego arma la ficha con el comentario, después manda WhatsApp. Si el número falla, igual tiene que salir de la cola para marcarlo Error en Contactados.
- **Decisión:** WhatsApp se habilita recién con ficha. Al tocarlo, `en_cola: false` aunque no haya `wa.me`. El estado Error lo pone Diego en el listado.
- **Qué se descartó:** WhatsApp antes de la ficha; marcar Error en automático.

### 2026-09-22 — CRM-DEC-013 — Error WSP del día devuelve cupo
- **Contexto:** Abrir wa.me suma 1 al cupo de 25 aunque el número falle. Diego marca Error WSP a mano.
- **Decisión:** Si el estado pasa a `error` y hubo un WhatsApp que consumió cupo **hoy** (calendario Mendoza), se resta 1. Un teléfono inválido (sin `wa.me`) no resta porque no había sumado. Un error de otro día no toca el cupo de hoy.
- **Qué se descartó:** Cron de reset; devolver cupo al marcar Error sobre envíos viejos.

### 2026-10-08 — CRM-DEC-020 — WhatsApp solo con teléfono usable
- **Contexto:** El botón WhatsApp se podía pulsar sin teléfono o con uno que no arma `wa.me`. Ese clic sacaba el contacto de la cola y pedía marcarlo Error.
- **Decisión:** Sin un teléfono que normalice a WhatsApp, el botón queda apagado. Si igual llega el pedido, el contacto sigue en la cola y no se registra envío. Reemplaza, en ese punto, a CRM-DEC-012.
- **Qué se descartó:** Seguir sacando de la cola un teléfono que no abre WhatsApp.

### 2026-10-07 — CRM-DEC-019 — El mail no tiene tope
- **Contexto:** El cupo de mail frenaba el botón al llegar al mismo límite que WhatsApp.
- **Decisión:** Mail no tiene tope. Cada borrador abierto suma 1 a la cuenta del día. Si se marca error ese día, esa cuenta baja 1. WhatsApp sigue con su límite.
- **Qué se descartó:** Compartir el tope de WhatsApp.

### 2026-10-07 — CRM-DEC-018 — El HTML se abre en Mail para quedar en Enviados
- **Contexto:** El HTML salía por el servicio de email y no aparecía en la bandeja de enviados de Mail.
- **Decisión:** Mail abre un borrador HTML (negro y oro, imagen hosteada de la pieza) como redacción, con la cuenta por defecto de Mail y el botón Enviar. En esta Mac lo abre el servidor local. En el sitio publicado lo abre la app San Rafael 360 de esta Mac, igual que en desarrollo. No se descarga un archivo. Al enviarlo queda en Enviados.
- **Qué se descartó:** Enviar la captación por el servicio de email, porque esa copia no entra en Enviados.

### 2026-10-07 — CRM-DEC-017 — El mail de captación es HTML
- **Contexto:** El `mailto:` abría texto plano y un link a localhost. No mostraba la pieza.
- **Decisión:** El cuerpo es HTML negro y oro, con la imagen hosteada de la pieza. Quedó reemplazada por CRM-DEC-018 en el modo de entrega: el borrador se abre en Mail.
- **Qué se descartó:** Seguir abriendo el cliente de correo con texto plano.

### 2026-10-07 — CRM-DEC-016 — Ficha mínima con mail
- **Contexto:** La lista de la IA trae mail y no teléfono. Crear ficha exigía teléfono, así que el botón quedaba apagado y no se podía abrir el mail.
- **Decisión:** Alcanza nombre + categoría + teléfono válido o mail válido. El mail se guarda en la ficha. Sin categoría el botón sigue apagado.
- **Qué se descartó:** Seguir exigiendo teléfono para publicar.

### 2026-10-07 — CRM-DEC-015 — Mail abre el correo, igual que wa.me
- **Contexto:** La cola solo abordaba por WhatsApp. Diego también escribe por mail y quiere el mismo mensaje, el mismo registro y un cupo que no se coma el de WhatsApp.
- **Decisión:** El contacto guarda `email`. Cupo de mail aparte, con el mismo límite del tenant. Modo guía sigue exigiendo ficha. El `mailto:` de esta decisión quedó reemplazado por CRM-DEC-017.
- **Qué se descartó:** Compartir el contador de WhatsApp; un estado de error nuevo.

### 2026-09-23 — CRM-DEC-014 — Prospector = vigencia admin, no un build por cliente
- **Contexto:** El primer cliente (dueño `argendeli01@gmail.com`) paga Captación. No es un producto llamado Argendeli: es el mismo CRM con tenant `agenda`. Diego carga ~25 leads/día y el cliente también puede ingerir; el WhatsApp sale por `wa.me` en la línea del cliente.
- **Decisión:** Alta de cliente = fecha de vencimiento en Pagos (como Elite), campos `is_prospector` + `prospector_valid_until`. Un botón guarda Premium y otro Prospector para no pisarse. Al guardar se crea/reactiva `crm-comercio` modo `agenda` (cupo 25) ligado al email del dueño. En agenda no hay **Crear ficha**; `wa.me` no exige listing. Los comentarios se apilan como `crm-actividad` tipo `nota`. Cobro MP más adelante, mismo sistema de pagos.
- **Qué se descartó:** Código a medida por cliente; mezclar Prospector con `is_premium`; WhatsApp de agenda atado a ficha de la guía (CRM-DEC-012 sigue en tenant `guia`).
