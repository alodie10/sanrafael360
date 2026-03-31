cd public_html || cd domains/sanrafael360.com/public_html || exit 1
echo "=== LOGO SEARCH ==="
curl -s https://sanrafael360.com/ | grep -iE 'src="[^"]*logo[^"]*"' | grep -v 'plugins' | head -n 3

echo "=== UPDATING LISTEO OPTIONS ==="
wp option get listeo_core_options --format=json > lcore.json || true
if [ -s lcore.json ]; then
  sed -i 's/"Add Listing"/"Publicar Anuncio"/g' lcore.json
  sed -i 's/"Sign In"/"Iniciar Sesión"/g' lcore.json
  wp option update listeo_core_options --format=json < lcore.json
fi

echo "=== FIXING ELEMENTOR HOMEPAGE 404 ==="
HOMEPAGE_ID=$(wp option get page_on_front)
if [ ! -z "$HOMEPAGE_ID" ]; then
  wp post meta get $HOMEPAGE_ID _elementor_data > pm.json || true
  if [ -s pm.json ]; then
    sed -i -e 's|\\"url\\":\\"#\\"|\\"url\\":\\"/listings/\\"|g' \
           -e 's/\\"url\\":\\"#\\"/\\"url\\":\\"/listings/\\"/g' \
           -e 's/"All Services"/"Servicios"/g' \
           -e 's/All Services/Servicios/g' \
           -e 's/"Portal"/"Portal"/g' \
           -e 's/"Search"/"Buscar"/g' pm.json
    wp post meta update $HOMEPAGE_ID _elementor_data "$(cat pm.json)"
  fi
fi

echo "=== FIXING CATEGORY LISTING STRING ==="
# Elementor widgets or taxonomy metas might have the word 'Listing'
wp search-replace "Listing" "Anuncio" --skip-columns=guid --tables=wp_options,wp_postmeta || true

echo "=== ALL DONE ==="
