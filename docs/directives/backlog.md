# 📅 Backlog & Mantenimiento Futuro (San Rafael 360)

## 📅 Tareas Pendientes
- **Migración Google Places**: Reemplazar `google.maps.places.Autocomplete` por `google.maps.places.PlaceAutocompleteElement` (Web Component) antes de Marzo 2026 para evitar obsolescencia. Priorizar la conservación del diseño 'Obsidian' actual durante la migración.
- **Soporte Multi-Categoría para Negocios**: Implementar relación Many-to-Many en Strapi para que un negocio pertenezca a varias categorías. [Ver Plan de Migración de Categorías](plan_migracion_categorias.md)
- **Upgrade React 18 → React 19**: El proyecto corre Next.js 16.2.1 (requiere React 19) pero tiene React 18 instalado. Esto genera errores de tipos en el validator de Next.js (`bigint not assignable to ReactNode` en los layouts). Fix: `npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19` y revisar breaking changes de React 19 en toda la app (especialmente el nuevo ciclo de vida de `useEffect`, refs como props, etc.). Hacerlo con dedicación en una rama separada.
