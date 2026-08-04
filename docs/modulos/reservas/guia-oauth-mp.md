# Guía — OAuth Mercado Pago (E4)

Conectar la cuenta MP del local **sin copiar** el Access Token.

## Qué hace

1. En Config del comercio → **Conectar Mercado Pago**.
2. El dueño inicia sesión en Mercado Pago y autoriza a San Rafael 360.
3. MP redirige al backend; guardamos access (+ refresh) **cifrados** en ese comercio.
4. Se puede apagar simulación y cobrar. El pegado manual (E3) sigue como respaldo.

## Setup (una vez, app de SR360)

1. En [MP Developers → Tu aplicación](https://www.mercadopago.com.ar/developers/panel/app) (la de **San Rafael 360**, no la del local).
2. Configurar **Redirect URI** exacta:
   - Local con túnel: `https://<tu-tunnel>/api/reservas/mp/oauth/callback`
   - Prod: `https://<BACKEND_URL>/api/reservas/mp/oauth/callback`
3. Copiar **Client ID** y **Client Secret** (credenciales de la aplicación).
4. En `backend/.env` (y Railway):

```env
MP_OAUTH_CLIENT_ID=...
MP_OAUTH_CLIENT_SECRET=...
MP_OAUTH_REDIRECT_URI=https://<BACKEND_URL>/api/reservas/mp/oauth/callback
MP_TOKEN_ENCRYPTION_KEY=<ya existente, 64 hex>
FRONTEND_URL=http://localhost:3000
BACKEND_URL=https://<mismo host que el redirect>
```

5. Reiniciar Strapi. En Config debe aparecer el botón (si faltan vars, verás el aviso de OAuth deshabilitado).

## Quién puede conectar

Admin o dueño con acceso al módulo (`require-reserva-access`). Desconectar limpia el token y fuerza simulación ON.

**Operación remota (admin administra, owner vincula):** el owner hace OAuth con la MP del local; con `operado_por_plataforma=true` el admin es quien apaga simulación. Playbook y mensaje copiable: [alta-cliente.md](alta-cliente.md) §3.

## Local: NXDOMAIN de `*.trycloudflare.com`

En algunas Mac el callback del túnel falla con `DNS_PROBE_FINISHED_NXDOMAIN` aunque el túnel esté up. Si MP ya redirigió con `?code=…&state=…`, se puede completar pegando esa URL al agente o llamando:

`http://127.0.0.1:1337/api/reservas/mp/oauth/callback?code=…&state=…`

(El `code` vence ~10 min.) En prod (Railway) el redirect HTTPS público no tiene este problema.
