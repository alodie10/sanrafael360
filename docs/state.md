# San Rafael 360 - Estado del Proyecto

**Última actualización:** 2026-07-13

## Flujo de ramas (obligatorio)

| Rama | Uso |
|------|-----|
| **`develop`** | Desarrollo diario. Commits del agente y push de Diego van acá. |
| **`master`** | Producción. Solo promover cuando Diego lo pida (`./promote.sh` + push manual). |

**Regla:** No pushear features nuevas directo a `master`. Sincronizado el 2026-07-13: `develop` = `master` en `ddccaa9` (Sprint 4 en prod).

### Promover a prod (cuando Diego avise)

```bash
./promote.sh          # tests + build + merge develop → master (local)
git push origin master  # Diego — despliega Railway/Vercel
```

---

## Sprints

| Sprint | Estado |
|--------|--------|
| 0–3 Backend | ✅ Completado |
| 4 Frontend SSR | ✅ Completado (prod + develop) |
| 5 Calidad sostenible | ✅ Completado |

Detalle en [`AVANCES.md`](../AVANCES.md) y [`backlog.md`](../backlog.md).

---

## Próximo trabajo (P2 — residual post-Sprint 5)

1. **FE-03** — Migrar URLs Strapi duplicadas a `getStrapiUrl()`
2. **FE-09** — Extender `getSiteUrl()` en sitemap/robots/schemas
3. **FE-04** — `error.tsx` en `/portal`, `/categoria`

**Sprint 4 residual (P2):** warnings build ofertas/sitemap sin Strapi.
