# Proyecto: San Rafael 360

## 🛠️ Tareas Completadas
1. **Conexión SSH:** Configurada y probada con `plink.exe`.
2. **Traducción Integral:** Se tradujeron cadenas rebeldes corregidas (Add Listing, Sign In, Services).
3. **Visibilidad UI:** Se corrigió el contraste en la barra de búsqueda y el logo roto en el header sticky.
4. **Galerías de Negocios:** 
   - Se corrigió el error crítico de PHP en Listeo mediante el ajuste del formato de metadatos (`ID => URL`).
   - Se importaron galerías enriquecidas para los negocios con sitio web/redes sociales.
5. **Contenido:** Anuncios realistas de prueba creados y sincronizados.

## 📝 Tareas Pendientes
- **UI Dropdown Categorías:** El problema del corte en el selector "Todas las categorías" se solucionó temporalmente agregando una subcategoría vacía ("zzz") al final de la lista, forzando al _script_ del tema a cortar el elemento falso en lugar de una categoría real.

## 📝 Notas Finales
- El fix de "Services" y "Visibilidad" se encuentra al final de `functions.php`.
- Los scripts de importación de galerías (`import_gallery.php`, `scrape_gallery.py`) están operativos en el directorio raíz.
- Se recomienda usar un Child Theme en el futuro.

