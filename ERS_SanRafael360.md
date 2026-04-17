# San Rafael 360
## Especificación de Requerimientos de Software (ERS)
### Hoja de Ruta para Evolución a Plataforma Tipo Yelp

| Campo | Valor |
|-------|-------|
| Versión | 1.0 |
| Fecha | Abril 2026 |
| Plataforma | sanrafael360.com |
| Región | San Rafael, Mendoza, Argentina |
| Documento | ERS-SR360-2026-001 |

---

## Índice

1. [Introducción](#1-introducción)
2. [Estado Actual del Sistema](#2-estado-actual-del-sistema)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales)
4. [Requerimientos No Funcionales](#4-requerimientos-no-funcionales)
5. [Arquitectura Técnica Recomendada](#5-arquitectura-técnica-recomendada)
6. [Roadmap de Implementación](#6-roadmap-de-implementación)
7. [Modelo de Negocio y Monetización](#7-modelo-de-negocio-y-monetización)
8. [Riesgos y Mitigaciones](#8-riesgos-y-mitigaciones)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento constituye la Especificación de Requerimientos de Software (ERS) para la plataforma San Rafael 360, elaborada bajo el estándar IEEE 830. Define el estado actual del sistema, identifica las brechas funcionales respecto a plataformas de referencia como Yelp, y establece los requerimientos necesarios para transformar el directorio local en una plataforma de descubrimiento, reseñas y reservas de clase mundial para San Rafael, Mendoza.

### 1.2 Alcance del Sistema

San Rafael 360 es actualmente un directorio digital de negocios locales orientado al turismo y la comunidad de San Rafael, Mendoza. Contempla tres categorías principales:

- Alojamientos (hoteles, cabañas, hosterías)
- Gastronomía (restaurantes, bares, cafés)
- Actividades (turismo aventura, excursiones, deportes)

El sistema aspira a convertirse en la plataforma de referencia para que turistas y residentes descubran, evalúen, reserven e interactúen con los negocios locales de San Rafael, compitiendo con plataformas como Yelp, TripAdvisor y Google Maps en el ámbito hiperlocal.

### 1.3 Definiciones y Acrónimos

| Sigla | Definición |
|-------|-----------|
| ERS | Especificación de Requerimientos de Software |
| RF | Requerimiento Funcional |
| RNF | Requerimiento No Funcional |
| UGC | User Generated Content — contenido generado por usuarios |
| SEO | Search Engine Optimization |
| MVP | Minimum Viable Product — producto mínimo viable |

### 1.4 Stakeholders

Los actores relevantes del sistema son:

- **Turistas:** visitantes que buscan información sobre servicios en San Rafael
- **Residentes:** habitantes locales que buscan negocios y servicios cotidianos
- **Propietarios de negocios:** comerciantes que desean visibilidad digital
- **Administradores de la plataforma:** equipo de San Rafael 360

---

## 2. Estado Actual del Sistema

### 2.1 Funcionalidades Existentes

A partir del análisis del sitio web en producción (sanrafael360.com, abril 2026), se identifican las siguientes funcionalidades implementadas:

- Navegación por categorías: Alojamientos, Gastronomía, Actividades
- Página de contacto para alta de negocios (formulario manual)
- Sistema de autenticación básico (`/login`)
- Presencia digital 24/7 con mapa interactivo mencionado en el landing
- Optimización SEO básica por categorías locales
- Interfaz responsive construida en Next.js

### 2.2 Análisis de Brechas (Gap Analysis) vs. Yelp

| Funcionalidad | Estado Actual | Gap con Yelp |
|--------------|--------------|-------------|
| Directorio de negocios por categoría | ✅ Implementado | Sin brecha significativa |
| Registro y login de usuarios | ⚠️ Parcial | Solo existe /login, sin registro público ni OAuth |
| Perfil completo de negocio | ❌ Ausente | Falta: horarios, fotos, menú/servicios, precio promedio |
| Sistema de reseñas y calificaciones | ❌ Ausente | No existe ningún mecanismo de reviews |
| Búsqueda con filtros avanzados | ❌ Ausente | Sin búsqueda, sin filtros por precio/rating/horario |
| Mapa interactivo con pins de negocios | ⚠️ Parcial | Mencionado pero no visible en producción |
| Fotos subidas por usuarios | ❌ Ausente | Sin galería ni upload de imágenes |
| Sistema de reservas / contacto directo | ❌ Ausente | Solo formulario de alta para el dueño |
| Panel de gestión para negocios | ❌ Ausente | No existe dashboard para propietarios |
| Notificaciones y alertas | ❌ Ausente | Sin sistema de notificaciones |
| Modelo de monetización | ❌ Ausente | Sin planes pagos, sin publicidad destacada |
| App móvil nativa | ❌ Ausente | Solo web responsive |
| API pública | ❌ Ausente | Sin endpoints documentados |

---

## 3. Requerimientos Funcionales

Los siguientes requerimientos funcionales están organizados por módulo y priorizados según su impacto en la experiencia del usuario y la viabilidad del negocio.

### 3.1 Módulo de Usuarios

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-01 | Usuarios | El sistema debe permitir registro de nuevos usuarios con email y contraseña, con validación de email. | 🔴 ALTA | Pendiente |
| RF-02 | Usuarios | El sistema debe soportar autenticación OAuth con Google y Facebook. | 🔴 ALTA | Pendiente |
| RF-03 | Usuarios | Los usuarios deben poder gestionar su perfil: foto, nombre, bio, historial de reseñas. | 🟡 MEDIA | Pendiente |
| RF-04 | Usuarios | El sistema debe implementar recuperación de contraseña por email. | 🔴 ALTA | Pendiente |
| RF-05 | Usuarios | Los usuarios deben poder guardar negocios favoritos en una lista personal. | 🟡 MEDIA | Pendiente |
| RF-06 | Usuarios | El sistema debe diferenciar roles: Usuario, Propietario de Negocio y Administrador. | 🔴 ALTA | Pendiente |

### 3.2 Módulo de Negocios

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-07 | Negocios | Cada negocio debe tener perfil completo: nombre, descripción, categoría, dirección, teléfono, web, email y redes sociales. | 🔴 ALTA | Parcial |
| RF-08 | Negocios | Los negocios deben mostrar horarios de atención diferenciados por día de la semana. | 🔴 ALTA | Pendiente |
| RF-09 | Negocios | Cada negocio debe tener una galería de fotos con hasta 20 imágenes. | 🔴 ALTA | Pendiente |
| RF-10 | Negocios | Los negocios deben mostrar un indicador de rango de precios ($ / $$ / $$$ / $$$$). | 🟡 MEDIA | Pendiente |
| RF-11 | Negocios | El sistema debe mostrar en cada perfil si el negocio está "Abierto ahora" o "Cerrado" en tiempo real. | 🔴 ALTA | Pendiente |
| RF-12 | Negocios | Los negocios de gastronomía deben poder subir su carta/menú en formato estructurado. | 🟡 MEDIA | Pendiente |
| RF-13 | Negocios | Los negocios de alojamiento deben poder mostrar tipos de habitación, capacidad y amenities. | 🟡 MEDIA | Pendiente |
| RF-14 | Negocios | Cada negocio debe tener una URL canónica única y optimizada para SEO. | 🔴 ALTA | Pendiente |

### 3.3 Módulo de Reseñas y Calificaciones

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-15 | Reseñas | Los usuarios registrados deben poder escribir reseñas con texto (mín. 50 caracteres) y calificación de 1 a 5 estrellas. | 🔴 ALTA | Pendiente |
| RF-16 | Reseñas | Los usuarios deben poder adjuntar hasta 5 fotos a cada reseña. | 🟡 MEDIA | Pendiente |
| RF-17 | Reseñas | El sistema debe calcular y mostrar el rating promedio del negocio basado en todas sus reseñas. | 🔴 ALTA | Pendiente |
| RF-18 | Reseñas | Los propietarios de negocios deben poder responder públicamente a las reseñas. | 🔴 ALTA | Pendiente |
| RF-19 | Reseñas | Los usuarios deben poder marcar reseñas como "Útil" o reportarlas como inapropiadas. | 🟡 MEDIA | Pendiente |
| RF-20 | Reseñas | El sistema debe implementar moderación automática de contenido ofensivo antes de publicar. | 🔴 ALTA | Pendiente |
| RF-21 | Reseñas | El sistema debe enviar notificación al propietario cuando recibe una nueva reseña. | 🟡 MEDIA | Pendiente |
| RF-22 | Reseñas | Solo se debe permitir una reseña por usuario por negocio (editable posterior). | 🔴 ALTA | Pendiente |

### 3.4 Módulo de Búsqueda y Descubrimiento

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-23 | Búsqueda | El sistema debe proveer búsqueda full-text por nombre de negocio, descripción y categoría. | 🔴 ALTA | Pendiente |
| RF-24 | Búsqueda | La búsqueda debe soportar filtros combinables: categoría, rango de precios, rating mínimo y "abierto ahora". | 🔴 ALTA | Pendiente |
| RF-25 | Búsqueda | El sistema debe ofrecer ordenamiento de resultados por: relevancia, rating, distancia y más reciente. | 🔴 ALTA | Pendiente |
| RF-26 | Búsqueda | Debe existir un mapa interactivo (Google Maps o Leaflet) con pins de todos los negocios filtrables. | 🔴 ALTA | Pendiente |
| RF-27 | Búsqueda | El sistema debe mostrar secciones editoriales: "Más valorados", "Nuevos en la plataforma", "Abiertos ahora". | 🟡 MEDIA | Pendiente |
| RF-28 | Búsqueda | El sistema debe implementar autocompletado en el buscador con sugerencias en tiempo real. | 🟡 MEDIA | Pendiente |

### 3.5 Módulo de Gestión para Propietarios

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-29 | Panel Negocio | Los propietarios deben tener un dashboard con métricas: visitas al perfil, clics en teléfono/web, evolución de rating. | 🔴 ALTA | Pendiente |
| RF-30 | Panel Negocio | Los propietarios deben poder actualizar todos los datos de su negocio sin intervención del administrador. | 🔴 ALTA | Pendiente |
| RF-31 | Panel Negocio | El sistema debe permitir a los propietarios publicar ofertas y promociones con fecha de vencimiento. | 🟡 MEDIA | Pendiente |
| RF-32 | Panel Negocio | Los propietarios deben poder gestionar un calendario de disponibilidad para actividades y alojamientos. | 🟡 MEDIA | Pendiente |
| RF-33 | Panel Negocio | El sistema debe enviar reportes semanales por email al propietario con las métricas de su negocio. | 🟢 BAJA | Pendiente |

### 3.6 Módulo de Reservas y Contacto

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-34 | Reservas | Los usuarios deben poder enviar consultas directas al negocio desde la plataforma (con historial). | 🔴 ALTA | Pendiente |
| RF-35 | Reservas | Los negocios de alojamiento deben poder activar un módulo de solicitud de reserva con fechas y cantidad de personas. | 🔴 ALTA | Pendiente |
| RF-36 | Reservas | El sistema debe enviar confirmación por email tanto al usuario como al propietario ante cada consulta o reserva. | 🔴 ALTA | Pendiente |
| RF-37 | Reservas | Debe existir integración con WhatsApp Business para contacto directo desde el perfil del negocio. | 🟡 MEDIA | Pendiente |

### 3.7 Módulo de Administración

| ID | Módulo | Descripción | Prioridad | Estado |
|----|--------|-------------|-----------|--------|
| RF-38 | Admin | El administrador debe poder aprobar, rechazar o eliminar negocios y reseñas desde un panel de control. | 🔴 ALTA | Pendiente |
| RF-39 | Admin | El panel de administración debe mostrar métricas globales: total de negocios, usuarios, reseñas y tráfico. | 🔴 ALTA | Pendiente |
| RF-40 | Admin | El administrador debe poder gestionar categorías, etiquetas y atributos de negocios. | 🟡 MEDIA | Pendiente |
| RF-41 | Admin | El sistema debe permitir al administrador destacar negocios en la home y en búsquedas (modelo de monetización). | 🔴 ALTA | Pendiente |

---

## 4. Requerimientos No Funcionales

### 4.1 Rendimiento

- El tiempo de carga inicial de cualquier página no debe superar 2.5 segundos en conexión 4G.
- Las búsquedas deben retornar resultados en menos de 500ms para hasta 10.000 negocios indexados.
- El sistema debe soportar al menos 500 usuarios concurrentes sin degradación de performance.
- Las imágenes deben servirse en formato WebP con lazy loading y CDN.

### 4.2 Seguridad

- Todas las comunicaciones deben realizarse sobre HTTPS/TLS 1.3.
- Las contraseñas deben almacenarse con bcrypt (factor de costo mínimo 12).
- El sistema debe implementar rate limiting en endpoints de autenticación (máx. 10 intentos/15min por IP).
- Los tokens JWT deben tener expiración de 24hs con refresh token de 30 días.
- Se debe implementar sanitización de todas las entradas de usuario para prevenir XSS y SQL Injection.

### 4.3 Disponibilidad y Escalabilidad

- El sistema debe garantizar un uptime del 99.5% mensual.
- La arquitectura debe permitir escalar horizontalmente sin cambios de código.
- Se deben implementar backups automáticos de la base de datos cada 24 horas.
- El sistema debe contar con un mecanismo de health check y alertas automáticas ante caídas.

### 4.4 Usabilidad y Accesibilidad

- La interfaz debe ser plenamente funcional en dispositivos móviles (mobile-first).
- El sistema debe cumplir con estándares WCAG 2.1 nivel AA de accesibilidad.
- El tiempo de aprendizaje para un usuario nuevo debe ser inferior a 5 minutos.
- La plataforma debe estar en español, con estructura preparada para internacionalización (i18n).

### 4.5 SEO y Posicionamiento

- Cada perfil de negocio debe generar metadatos Open Graph y Schema.org (LocalBusiness).
- El sistema debe generar un `sitemap.xml` dinámico actualizado con cada nuevo negocio.
- Las URLs deben ser semánticas y amigables: `/gastronomia/nombre-del-restaurante`.
- El sistema debe implementar SSR o SSG para todos los perfiles públicos (Next.js).

---

## 5. Arquitectura Técnica Recomendada

### 5.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router) — React, TailwindCSS, TypeScript |
| Backend | Node.js + Express — API REST con arquitectura en capas |
| Base de Datos | PostgreSQL (datos relacionales) + Redis (caché y sesiones) |
| Búsqueda | Algolia o ElasticSearch para full-text search con facetas |
| Storage | AWS S3 o Cloudflare R2 para imágenes y archivos |
| Mapas | Leaflet (open source) o Google Maps Platform |
| Email | Resend o SendGrid para emails transaccionales |
| Auth | NextAuth.js con JWT + OAuth (Google, Facebook) |
| Hosting | Vercel (frontend) + Railway o Render (backend + DB) |
| CDN | Cloudflare para assets estáticos y protección DDoS |

### 5.2 Modelo de Datos Principal

Las entidades core del sistema son:

```
User
  id, email, password_hash, name, avatar, role, created_at

Business
  id, name, slug, category_id, description, address,
  lat, lng, phone, web, price_range, status, owner_id

BusinessHours
  id, business_id, day_of_week, open_time, close_time, is_closed

Review
  id, business_id, user_id, rating, text, created_at, updated_at

ReviewPhoto
  id, review_id, url, order

BusinessPhoto
  id, business_id, url, caption, is_cover, order

Category
  id, name, slug, icon, parent_id

Favorite
  id, user_id, business_id, created_at

Message
  id, from_user_id, business_id, subject, body, status, created_at
```

---

## 6. Roadmap de Implementación

Se propone una implementación iterativa en 4 fases, priorizando funcionalidades que generan valor inmediato al usuario y al negocio.

| Fase | Período | Funcionalidades | Esfuerzo Estimado |
|------|---------|----------------|-------------------|
| Fase 1 | Mes 1-2 | Registro/login usuarios, OAuth Google, perfiles de negocio completos (horarios, fotos, precio), panel de propietario básico | 3-4 semanas dev |
| Fase 2 | Mes 2-3 | Sistema de reseñas y calificaciones, moderación automática, notificaciones por email, rating promedio en perfiles | 3-4 semanas dev |
| Fase 3 | Mes 3-4 | Búsqueda full-text con filtros, mapa interactivo con pins, secciones editoriales, autocompletado | 4-5 semanas dev |
| Fase 4 | Mes 4-6 | Módulo de reservas, integración WhatsApp, modelo de monetización (negocios destacados), analytics avanzado | 5-6 semanas dev |

### 6.1 Criterios de Éxito por Fase

#### Fase 1 — Fundación
- Al menos 50 negocios con perfil completo cargado
- 100 usuarios registrados en el primer mes
- Tiempo de carga < 2.5s en móvil

#### Fase 2 — Comunidad
- Al menos 200 reseñas publicadas en el primer mes post-lanzamiento
- Tasa de respuesta de propietarios a reseñas > 40%
- 0 reseñas ofensivas publicadas sin moderación

#### Fase 3 — Descubrimiento
- CTR desde búsqueda > 15%
- Tiempo promedio en sitio > 3 minutos
- Posicionamiento en top 3 de Google para "restaurantes San Rafael Mendoza"

#### Fase 4 — Monetización
- Al menos 10 negocios con plan pago activo
- Tasa de conversión consulta → reserva > 5%
- MRR (Monthly Recurring Revenue) > USD 500

---

## 7. Modelo de Negocio y Monetización

Para ser sostenible, San Rafael 360 debe implementar un modelo freemium similar al de Yelp, con las siguientes capas:

### 7.1 Plan Gratuito (Listing básico)
- Perfil con información básica, 3 fotos y aparición en búsquedas
- Recepción de reseñas y posibilidad de respuesta
- Estadísticas básicas de visitas

### 7.2 Plan Profesional (USD 29/mes)
- Perfil completo con galería ilimitada de fotos
- Aparición destacada en resultados de búsqueda de su categoría
- Analytics avanzado con comparativa de competidores
- Módulo de publicación de ofertas y promociones
- Notificaciones prioritarias de nuevas reseñas

### 7.3 Plan Premium (USD 59/mes)
- Todo lo del Plan Profesional
- Banner destacado en la home page
- Módulo de reservas integrado
- Reportes mensuales detallados en PDF
- Soporte prioritario con gestor de cuenta asignado

### 7.4 Publicidad Contextual
- Anuncios de negocios en resultados de búsqueda relevantes (CPC)
- Banners en páginas de categoría
- Negocios patrocinados en secciones editoriales de la home

---

## 8. Riesgos y Mitigaciones

### 8.1 Riesgos Identificados

| Riesgo | Estrategia de Mitigación |
|--------|--------------------------|
| Baja adopción inicial de propietarios | Equipo comercial local y plan gratuito atractivo |
| Reseñas falsas o malintencionadas | Moderación automática + sistema de reporte de usuarios |
| Competencia de Google Maps y TripAdvisor | Foco hiperlocal y contenido exclusivo de San Rafael |
| Picos de tráfico en temporada alta | Arquitectura cloud elástica con autoescalado |
| Dependencia de un único proveedor de mapas | Abstracción de la capa de mapas con interfaz intercambiable |

### 8.2 Dependencias Críticas

- Disponibilidad de la API de Google Maps o Leaflet para el mapa interactivo
- Servicio de email transaccional para notificaciones (Resend / SendGrid)
- Servicio de almacenamiento de imágenes (AWS S3 / Cloudflare R2)
- Motor de búsqueda full-text para los filtros avanzados (Algolia / Elasticsearch)

---

*ERS-SR360-2026-001 | San Rafael 360 | sanrafael360.com | hola@sanrafael360.com*
