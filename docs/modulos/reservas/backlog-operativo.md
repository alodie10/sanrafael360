# Backlog operativo — reservas (sin saltar pasos)

Orden fijo. No marcar hecho hasta verificar el criterio.

| # | Paso | Criterio de done | Estado |
|---|------|------------------|--------|
| A1 | Checklist en docs | Este archivo existe y se actualiza | ✅ |
| A2 | Relación blanda `reserva-comercio.negocio` | Schema + seed linkea Jaditek a un `negocio` | ✅ |
| A3 | Auth dueño OR admin | Owner solo su slug; admin todos | ✅ |
| A4 | CTA portal dueño | Card Jaditek → Gestionar reservas | ✅ |
| A5 | Entry admin intacta | `/portal/admin` → módulo reservas | ✅ |
| A6 | Link público en card | “Ver grilla pública” | ✅ |
| B1 | Túnel estable + `BACKEND_URL` | Webhook alcanzable desde internet | ✅ |
| B2 | 2º pago sandbox E2E | Reserva `confirmada` con `mp_payment_id` real | ✅ |
| B3 | Cancel + refund sandbox | Admin libera hueco; refund MP (UI si API falla); self = WhatsApp | ✅ |
| B4 | Token MP Jaditek | Token de la cuenta Jaditek (prueba) | ⬜ (hoy: app personal de Diego; falta cuenta Jaditek) |
| B5 | Redirect post-pago local | Omit `auto_return` en localhost | ✅ |
| C1 | Commit `develop` | Cuando Diego lo pida | ✅ |
| C2 | Push `origin/develop` | Cuando Diego lo pida (nunca master) | ✅ |

## Fase D/E — Multi-cliente + MP en portal (RES-DEC-009)

Orden fijo. No saltar.

| # | Paso | Criterio de done | Estado |
|---|------|------------------|--------|
| D0 | RES-DEC-009 documentada | Este corte + `decisiones.md` | ✅ |
| D1 | Token MP cifrado por comercio | Admin pega token; GET solo `mp_configured`; checkout usa secreto cifrado (fallback `mp_token_env`) | ✅ |
| D2 | Flag `operado_por_plataforma` | UI admin: “Lo opera SR360 / Lo opera el dueño”; permisos de config respetan el flag | ✅ |
| E1 | Alta módulo desde `/portal/admin` | Elegir negocio → crea `reserva-comercio` + N recursos + soft-link; `modo_simulacion=true` | ⬜ |
| E2 | Gate simulación ↔ token | Sin token: solo simulación; con token: se puede apagar simulación | ⬜ |
| E3 | Guía “pedir token” no técnica | Copy + link docs en portal (capturas MP Developers / credenciales de prueba) | ⬜ |
| E4 | (Después) OAuth MP | Botón Conectar; deja de pedir pegar Access Token | ⬜ |

### Cómo pedirle el token a alguien no técnico (fase 1)

No le pedís “un secret de API”. Le pedís:

1. Entrar a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) con **su** usuario MP (el del local).  
2. Abrir (o crear) **su aplicación**.  
3. Ir a **Credenciales de prueba** (para sandbox) o **de producción** (cuando vayan a prod).  
4. Copiar el texto que dice **Access Token**.  
5. Pegarlo en el portal SR360 donde diga “Token de cobros”.

Vos (admin) podés hacerlo en una videollamada la primera vez. Cuando exista **E4 OAuth**, solo hacen clic en “Conectar Mercado Pago” e inician sesión: no copian nada.

## Notas

- Dominio agenda **separado** del directorio (RES-DEC-003). Solo vínculo opcional.
- Diego puede ser **admin + owner** a la vez: dos puertas, mismo motor.
- B4 espera acceso a la cuenta MP Jaditek; mientras tanto se prueba con token personal de sandbox.
- **Cancelación self-service:** el link del mail NO cancela solo; abre contacto WhatsApp del `negocio` vinculado. El admin libera en portal y reembolsa en MP según el caso.
- B3: con credenciales `APP_USR` de prueba el `POST /refunds` suele fallar (code 7); devolver en UI MP y/o liberar hueco desde admin (ya no bloquea si falla la API).
