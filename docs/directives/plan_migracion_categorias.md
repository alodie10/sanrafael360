# Plan de Migración: Múltiples Categorías por Negocio

Este documento detalla los pasos para transformar la relación actual (Many-to-One) entre Negocios y Categorías a una relación (Many-to-Many), permitiendo que un negocio (ej. Posada + Restaurante) pueda pertenecer a más de una categoría de forma simultánea.

**ADVERTENCIA**: Al cambiar el tipo de relación, Strapi suele eliminar la tabla de enlaces anterior. Es obligatorio realizar el backup indicado en la Fase 1.

## Fase 1: Respaldo previo (Crucial)
Antes de apagar Strapi o modificar código, guardar la relación actual de categorías directamente en la base de datos (SQLite).
Ejecutar la siguiente consulta SQL:
```sql
CREATE TABLE backup_categorias AS SELECT * FROM negocios_categoria_lnk;
```

## Fase 2: Modificar los esquemas en Strapi
Actualizar los esquemas JSON para cambiar de `manyToOne` a `manyToMany`.

1. **`backend/src/api/negocio/content-types/negocio/schema.json`**:
   Cambiar el campo `"categoria"` por `"categorias"`:
   ```json
   "categorias": {
     "type": "relation",
     "relation": "manyToMany",
     "target": "api::categoria.categoria",
     "inversedBy": "negocios"
   }
   ```
2. **`backend/src/api/categoria/content-types/categoria/schema.json`**:
   Actualizar la contraparte:
   ```json
   "negocios": {
     "type": "relation",
     "relation": "manyToMany",
     "target": "api::negocio.negocio",
     "mappedBy": "categorias"
   }
   ```

## Fase 3: Reinicio y Restauración de Datos
1. Reiniciar el backend de Strapi (`npm run develop`). Strapi detectará el cambio y creará la nueva tabla `negocios_categorias_lnk`.
2. Restaurar los datos del backup ejecutando en SQLite:
   ```sql
   INSERT INTO negocios_categorias_lnk (negocio_id, categoria_id) 
   SELECT negocio_id, categoria_id FROM backup_categorias;
   ```

## Fase 4: Adaptación del Frontend (Next.js)
El cambio en el backend significa que la API de Strapi devolverá un **array** en lugar de un objeto.
- **Consultas (Queries):** Cambiar toda referencia de `categoria` a `categorias` en las peticiones GraphQL/REST.
- **Interfaz Gráfica (UI):** En componentes como `BusinessCard`, iterar con `.map()` sobre `negocio.attributes.categorias.data` para renderizar múltiples insignias/badges.
- **Buscadores:** Ajustar los filtros si se filtraba por `categoria.slug` a `categorias.slug`.
