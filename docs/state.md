# San Rafael 360 - Estado del Proyecto

**Última actualización:** 2026-07-13

## Flujo de ramas (obligatorio)

| Rama | Uso |
|------|-----|
| **`develop`** | Desarrollo diario. Commits del agente y push de Diego van acá. |
| **`master`** | Producción. Solo promover cuando Diego lo pida (`./promote.sh` + push manual). |

**Regla:** No pushear features nuevas directo a `master`. Sincronizado el 2026-07-13: `develop` = `master` en `91dd8ad`.

### Promover a prod (cuando Diego avise)

```bash
./promote.sh          # tests + build + merge develop → master (local)
git push origin master  # Diego — despliega Railway/Vercel
```

---

## Sprints

| Sprint | Estado |
|--------|--------|
| 0–3 Backend | ✅ Completado (en prod y develop) |
| 4 Frontend SSR | ⏳ Siguiente — trabajar en `develop` |

Detalle en [`AVANCES.md`](../AVANCES.md) y [`backlog.md`](../backlog.md).

---

## Próximo trabajo (Sprint 4 en `develop`)

1. FE-01 — Home como Server Component
2. FE-07 / FE-08 — Portal y navbar sin waterfalls
3. FE-02, FE-04 — cache Strapi + error boundaries
