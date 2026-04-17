# ✅ Checklist de Estabilidad y Estándares

Este checklist debe ser completado mentalmente (o en el reporte) por el agente antes de dar por terminada una tarea.

### 1. Arquitectura (Clean Architecture)
- [ ] ¿La lógica de negocio reside en un `Service` y no en el `Controller`?
- [ ] ¿El acceso a datos está abstraído en un `Repository`?
- [ ] ¿El controlador solo orquesta y no tiene lógica compleja?
- [ ] ¿Las rutas tienen middlewares de validación?

### 2. Resiliencia (Error Handling)
- [ ] ¿Se usa `asyncHandler` para envolver rutas asíncronas?
- [ ] ¿Se usan errores tipados (`NotFoundError`, `ValidationError`, etc.)?
- [ ] ¿Se eliminaron los bloques `try/catch` redundantes?
- [ ] ¿Las fallas lanzan errores descriptivos pero seguros (sin stack trace en prod)?

### 3. Calidad de Código y Estética
- [ ] ¿Los nombres de variables y funciones son descriptivos?
- [ ] ¿El archivo tiene menos de 200 líneas (o se dividió en módulos)?
- [ ] ¿La interfaz sigue el estándar Premium (Vanilla CSS, Pro Vibe)?
- [ ] ¿Se ha verificado la compilación (`npm run build`)?

---
**Incumplir un solo punto de este checklist requiere revisión obligatoria.**
