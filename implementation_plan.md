# Migración a WhatsApp Cloud API (Oficial de Meta)

Este plan detalla los pasos necesarios para abandonar el bot "pirata" (basado en automatización web) y migrar la campaña de San Rafael 360 a la API oficial de WhatsApp, garantizando que el número no sea bloqueado ni reportado como spam.

## 📊 Estado Actual de tu Campaña
Revisé los archivos locales y este es el reporte exacto:
- **Total de contactos en lista:** ~195 (en `curada.csv`).
- **Mensajes enviados exitosamente:** 97 (registrados en `enviados.json`).
- **Restantes por enviar:** ~98 contactos.

> [!TIP]
> ¡Excelente progreso! El bot hizo la mitad del trabajo sin ser baneado gracias a las pausas que programamos, pero para escalar esto a cientos o miles de negocios, la API oficial es el único camino seguro.

## 💰 Cálculo de Costos (API Oficial)
Meta cobra por **"Conversación de 24 horas"**. El mensaje que estás enviando ofreciendo el plan PREMIUM se clasifica estrictamente como **Marketing**.

- **Costo en Argentina:** ~$0.060 USD por conversación de marketing.
- **Costo estimado para los 98 restantes:** ~$5.88 USD (aprox. $6 dólares).
- **Costo estimado para 1.000 negocios:** ~$60.00 USD.

> [!NOTE]
> *Ventaja:* Si un cliente te responde y tú le contestas (Mensaje de Servicio / Atención al cliente), esos mensajes de ida y vuelta durante las siguientes 24 horas son **gratuitos**. Solo pagas la "apertura" del canal con la plantilla de marketing.

## User Review Required

> [!WARNING]
> **Requisitos Legales de Meta**
> Para usar la API oficial necesitas:
> 1. Una cuenta de **Meta Business Manager** (idealmente verificada con datos de la empresa).
> 2. Una tarjeta de crédito asociada en Meta para los cobros.
> 3. El mensaje que enviemos ya no puede ser texto libre; debe ser enviado como una **"Plantilla (Template)"** que Meta debe aprobar previamente (suele tardar minutos en aprobarse, pero son estrictos con el formato).

## Open Questions

> [!IMPORTANT]
> 1. **El Número de Teléfono:** El número que se asocia a la API Oficial **no puede** usarse simultáneamente en la app de WhatsApp del celular o WhatsApp Web normal. ¿Usaremos un número nuevo exclusivo para la API, o estás dispuesto a migrar el número actual (perdiendo el acceso desde la app tradicional)?
> 2. **Respuestas de clientes:** Como no tendrás la app en el celular, para leer las respuestas de los clientes necesitaremos conectar el backend a una bandeja de entrada compartida (tipo chat en el portal) o reenviar los mensajes de alguna forma. ¿Cómo prefieres gestionar las respuestas?

## Proposed Changes

### 1. Configuración de Meta (Manual / Guiada)
- Crear App en el panel de Facebook Developers.
- Configurar WhatsApp Cloud API y obtener el `ACCESS_TOKEN` y el `PHONE_NUMBER_ID`.
- Crear la plantilla de marketing (ej: `sumate_directorio`) con variables `{{1}}` para el nombre del negocio.

### 2. Nuevo Script de Envío (`scripts/whatsapp-campaign/meta_bot.js`)

#### [NEW] `scripts/whatsapp-campaign/meta_bot.js`
- Script basado en Node.js puro sin necesidad de `whatsapp-web.js` ni levantar navegadores Chrome.
- Utilizará peticiones HTTP POST directamente a `graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`.
- Leerá `curada.csv` y respetará el archivo `enviados.json` para continuar exactamente donde lo dejaste.
- Velocidad de envío drásticamente mayor: Meta permite enviar cientos de mensajes por minuto sin riesgo de ban, ya que es la vía legal.

#### [MODIFY] `package.json`
- Añadir dependencia `axios` (o usar fetch nativo) para las llamadas a la API de Meta.

## Verification Plan

### Manual Verification
1. Generaremos un token de prueba desde tu Meta Business.
2. Usaremos un número de prueba proporcionado por Meta para enviar un mensaje a TU propio celular.
3. Verificaremos que el mensaje llega con el formato de la plantilla oficial (con botones si lo deseamos).
4. Una vez validado, reemplazamos por el token y número en producción e iniciamos la campaña para los 98 contactos restantes.
