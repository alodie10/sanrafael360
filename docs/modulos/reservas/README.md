# Módulo de reservas (suite San Rafael 360)

**Dueño del producto:** suite **San Rafael 360** (este repositorio).  
**Primer cliente:** **Jaditek Sim Racing** (local de simracing; repo de contexto del local: [Jaditek-SimR](https://github.com/) — carpeta hermana `Jaditek-SimR` en la máquina de desarrollo).

Este módulo **no** es el directorio de comercios. Es un **sistema de turnos + pago** (grilla online, panel admin, Mercado Pago) que se ofrece **con costo aparte** a comercios. Jaditek valida el producto en la vida real; después se puede ofrecer a otros listados de la guía.

Encaja con el ERS del directorio: hoy “reservar” suele ser un link externo o WhatsApp; RF-35 / RF-36 hablan de reservas nativas pendientes. Este módulo es el camino elegido para cubrir esa capacidad de forma reutilizable (no solo un botón que manda afuera).

## Documentos de esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [vision.md](vision.md) | Qué es el producto, flujos, reglas del primer cliente |
| [decisiones.md](decisiones.md) | Decisiones cerradas del módulo (RES-DEC-…) |
| [complejidad-y-stack.md](complejidad-y-stack.md) | Qué se reutiliza de SR360 vs qué se construye de cero |
| [primer-cliente-jaditek.md](primer-cliente-jaditek.md) | Cómo se configura Jaditek como comercio #1 |
| [alta-cliente.md](alta-cliente.md) | Instructivo: otorgar el módulo a un cliente (alta + OAuth remoto + modos de cobro) |
| [alcance-mvp.md](alcance-mvp.md) | Qué entra / qué no entra en la primera versión |
| [implementation_plan.md](implementation_plan.md) | Plan técnico MVP (datos, capas, spikes, PRs) |
| [mp-sandbox-runbook.md](mp-sandbox-runbook.md) | Cómo pasar de simulación a MP sandbox en local |
| [guia-token-mp.md](guia-token-mp.md) | Guía no técnica: pedir/pegar el token de cobros (E3) |
| [guia-oauth-mp.md](guia-oauth-mp.md) | OAuth: botón Conectar Mercado Pago (E4) |
| [backlog-operativo.md](backlog-operativo.md) | Checklist ordenado (portal + MP) — no saltar pasos |

## Relación con el repo Jaditek-SimR

Allí vive el **inventario del local físico** (simuladores, auriculares, competencia, otros componentes).  
Para **reservas (CMP-01)** ese repo solo apunta acá: la fuente de verdad del motor es **esta carpeta**.

## Estado (3 ago 2026)

MVP en prod + OAuth MP en portal (E4). Smoke webhook OK (cuenta MP de Diego; falta B4 Jaditek).  
Alta de cliente: [alta-cliente.md](alta-cliente.md) · Checklist: [backlog-operativo.md](backlog-operativo.md).
