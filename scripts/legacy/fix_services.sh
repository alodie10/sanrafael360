#!/bin/bash
# Script para corregir la palabra "Services" en el buscador de la página de inicio
set -e

# Intentar navegar al directorio público
cd public_html || cd domains/sanrafael360.com/public_html || exit 1

echo "=== INICIANDO REEMPLAZO DE 'SERVICES' ==="

# 1. Reemplazar en los datos de Elementor (Post Meta)
# Buscamos específicamente el patrón de etiqueta JSON de Elementor
HOMEPAGE_ID=$(wp option get page_on_front)
if [ ! -z "$HOMEPAGE_ID" ]; then
    echo "Procesando página de inicio (ID: $HOMEPAGE_ID)..."
    wp post meta get "$HOMEPAGE_ID" _elementor_data > elementor_data.json || true
    if [ -s elementor_data.json ]; then
        # Reemplazos específicos para no tocar slugs/URLs
        sed -i 's/"label":"Services"/"label":"Servicios"/g' elementor_data.json
        sed -i 's/"title":"Services"/"title":"Servicios"/g' elementor_data.json
        # Intentar con el formato que vimos en el HTML (puede estar hardcoded en el widget)
        sed -i 's/>Services</>Servicios</g' elementor_data.json
        
        wp post meta update "$HOMEPAGE_ID" _elementor_data "$(cat elementor_data.json)"
        echo "Metadatos de Elementor actualizados."
    fi
fi

# 2. Reemplazo general en base de datos (wp_options) 
# Esto cubre widgets del tema o configuraciones de Listeo
echo "Buscando en configuraciones del tema..."
wp search-replace '"Services"' '"Servicios"' --tables=wp_options --skip-columns=guid || true

# 3. Limpiar caché (LiteSpeed)
echo "Limpiando caché de LiteSpeed..."
wp litespeed-purge all || echo "LiteSpeed purge falló (puede que no esté el plugin activo o falle cli)"

echo "=== TODO LISTO ==="
echo "Por favor, verificá el sitio en modo incógnito."
