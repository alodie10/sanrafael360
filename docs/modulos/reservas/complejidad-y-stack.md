# Complejidad y stack — módulo de reservas

Fecha: **30 de julio de 2026**.

## Respuesta corta

San Rafael 360 **hoy no tiene** un motor de turnos con cupo. Tiene directorio + cobro Mercado Pago para **premium del listado**. El botón de reserva suele abrir un link externo o WhatsApp.

Lo que **sí** se reutiliza: la **forma de trabajar** (Next.js, Strapi, PostgreSQL, Mercado Pago, paneles, deploy).  
Lo que hay que **inventar:** agenda con recursos, grilla, estados de reserva, pago que confirma el turno, panel admin, cancelación/reembolso.

**Complejidad: media.** Viable para el equipo de SR360. No es un fin de semana ni un año, si el MVP se limita como en [alcance-mvp.md](alcance-mvp.md).

## Orden de magnitud (persona a tiempo completo o equivalente)

| Etapa | Tiempo orientativo | Qué sale |
|-------|--------------------|----------|
| Núcleo usable | **unas 6 a 10 semanas** | Comercio + recursos, grilla, MP confirma, admin básico |
| Base multi-comercio desde el día uno | **+2 a 4 semanas** respecto de un solo local hardcodeado | Entidad comercio, permisos, sin mezclar con “negocio” del directorio a la fuerza |
| Pulido | **unas 3 a 6 semanas más** | Mails, holds de pago, edge cases, tablet cómoda |
| Mantenimiento | **horas a días por mes** | MP, bugs, pedidos del primer cliente |

## Qué se reaprovecha de este repo

1. Bucle Mercado Pago (preferencia → checkout → webhook → efecto al pagar). Hoy activa premium; mañana confirma reserva.  
2. Auth / paneles / roles.  
3. Resend (mails).  
4. Deploy (Vercel + Railway), tests, variables de entorno.

## Qué no transferir tal cual

- Modelo `negocio` del directorio, Algolia, claim, premium de listado.  
- Widget que solo abre `reserva_url` externa.  
- Pensar que “horario de apertura” = “franjas vendibles”.

## Recomendación de forma

Producto **aparte o módulo limpio** (misma suite, dominio de datos de reservas propio). No enredar la agenda dentro del schema del discovery turístico.
