# PROTOCOLO DE AUTONOMÍA Y DEFINICIÓN DE TERMINADO (DoD)

## Protocolo de Autonomía (Alta Autonomía)

Para asegurar la agilidad del desarrollo, el equipo de Antigravity opera bajo un modelo de **Alta Autonomía**:

### 1. Criterio de Decisión "AI-First"
- **UI/UX y Técnica**: El equipo utiliza modelos de IA (Claude/GPT) para identificar las mejores prácticas estandarizadas para layouts móviles, manejos de estados y performance. 
- **Luz Verde**: Si el criterio técnico del desarrollador y la IA coinciden, la ejecución es inmediata y no requiere consulta.

### 2. Cuándo se requiere Validación Manual del Usuario
- **Presupuesto**: Cambios que alteren las horas estimadas inicialmente.
- **Identidad de Marca**: Cambios en logos, paletas de colores principales o tono de comunicación primario.
- **Funcionalidad Crítica**: Nuevas funcionalidades no contempladas en el Master Plan inicial.

---

## Definición de "Tarea Finalizada" (DoD)

Una tarea solo se considera completa cuando cumple los siguientes 4 criterios de post-build:

1.  **Verificación en Producción**: El build de Vercel/Railway ha finalizado con éxito y los cambios son visibles en la URL pública (sanrafael360.vercel.app).
2.  **Prueba "Mano en Celular"**: Verificación funcional en un dispositivo móvil real (o emulado con 4G Throttling). La navegación, búsqueda y portlets deben funcionar sin necesidad de recarga manual.
3.  **Smoke Test de Playwright en Producción**: Los tests de Playwright deben ejecutarse una última vez apuntando a la URL de producción y pasar al 100%.
4.  **Espera de Builds (Regla de Oro)**: Ante cualquier cambio de código, el desarrollador **DEBE esperar** a que el proceso de CI/CD (Vercel/Railway) termine por completo. No se iniciará ninguna fase de verificación hasta que el build esté vivo ("Live").

**Reporte Final Requerido**: *"Build en Vercel exitoso + Pruebas en URL de producción aprobadas"*.
