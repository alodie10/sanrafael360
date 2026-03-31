# San Rafael 360 - Entorno de Desarrollo Remoto y Portable

Este repositorio contiene el código fuente de **San Rafael 360** (Next.js + Strapi). Está diseñado para ser **100% portable y remoto**, eliminando la necesidad de infraestructura local pesada.

## Flujo de Trabajo (Portable)

Como el desarrollo se realiza contra un **host remoto (Hostinger)**, no necesitas instalar Node.js ni bases de datos en tu computadora local. El proceso para trabajar desde cualquier PC es:

1. **Clonar**: Baja el código de GitHub.
2. **Modificar**: Realiza cambios visuales o de lógica en el código.
3. **Commit \u0026 Push**: Sube los cambios a GitHub.
4. **Desplegar**: Tus cambios se reflejarán en el dominio remoto configurado (ej: `v2.sanrafael360.com`).

## Estructura del Proyecto

- `/frontend`: Aplicación Next.js (Visual).
- `/backend`: API de Strapi (Datos y Administración).
- `/scripts/legacy`: Carpeta con los scripts antiguos de migración, CSVs, ZIPs e imágenes para referencia histórica y seguridad.

## Configuración de Entorno (Remoto)

Para que tu editor (VS Code, etc.) reconozca las conexiones, asegúrate de configurar los archivos `.env`:

- `/frontend/.env.local`: Apunta a la URL de Strapi en el servidor remoto.
- `/backend/.env`: Configura las credenciales de la base de datos PostgreSQL de Hostinger.

*Usa los archivos `.env.example` de cada carpeta como guía.*

## Despliegue en Hostinger

El servidor remoto está configurado para ejecutar Next.js y Strapi. 
- **Backend Admin**: [https://v2.sanrafael360.com/admin](https://v2.sanrafael360.com/admin)
- **Frontend Live**: [https://v2.sanrafael360.com](https://v2.sanrafael360.com)

## Notas Importantes

- **Sin ejecución local**: Para evitar problemas de rendimiento y discrepancias de datos, **no ejecutes `npm install` ni `npm run dev` localmente**.
- **Base de Datos**: Siempre utiliza la base de datos en la nube (Hostinger) para que los cambios de contenido sean visibles desde todas tus notebooks.
