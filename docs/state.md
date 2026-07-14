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

## Próximo trabajo

1. **FE-11** — Login credentials (UI muerta o provider)
2. **DOC-02..06** — alineación docs / env / versiones
3. Backend residual BE-08..10 si priorizan arquitectura

**Cerrado 2026-07-14:** FE-03, FE-09, FE-04, FE-25, QA-08 (skip Discovery en CI).
