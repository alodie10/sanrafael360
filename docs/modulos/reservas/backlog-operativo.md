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
| C2 | Push `origin/develop` | Cuando Diego lo pida (nunca master) | ⬜ |

### B5. Redirect post-pago en local

Ya implementado: si `FRONTEND_URL` es localhost, **no** se envía `auto_return` (MP lo rechaza).  
El webhook confirma igual. Opcional después: túnel al frontend `:3000` para redirect automático.

## Notas

- Dominio agenda **separado** del directorio (RES-DEC-003). Solo vínculo opcional.
- Diego puede ser **admin + owner** a la vez: dos puertas, mismo motor.
- B4 espera acceso a la cuenta MP Jaditek; mientras tanto se prueba con token personal de sandbox.
- **Cancelación self-service:** el link del mail NO cancela solo; abre contacto WhatsApp del `negocio` vinculado. El admin libera en portal y reembolsa en MP según el caso.
- B3: con credenciales `APP_USR` de prueba el `POST /refunds` suele fallar (code 7); devolver en UI MP y/o liberar hueco desde admin (ya no bloquea si falla la API).
