set -e
cd public_html || cd domains/sanrafael360.com/public_html || exit 1

# Translate files
echo "Translating PHP files..."
find wp-content/themes/listeo wp-content/plugins/listeo-core wp-content/plugins/listeo-forms -type f \( -name "*.php" -o -name "*.js" \) -exec sed -i \
  -e 's/>Add Listing</>Publicar Anuncio</g' \
  -e "s/'Add Listing'/'Publicar Anuncio'/g" \
  -e 's/>Sign In</>Iniciar Sesión</g' \
  -e "s/'Sign In'/'Iniciar Sesión'/g" \
  -e 's/>Register</>Regístrate</g' \
  -e "s/'Register'/'Regístrate'/g" \
  -e 's/>All Categories</>Todas las Categorías</g' \
  -e "s/'All Categories'/'Todas las Categorías'/g" \
  -e 's/placeholder="Search"/placeholder="Buscar"/g' \
  {} +

echo "Creating content via wp-cli..."
wp post create --post_type="listing" --post_title="Bodega Bianchi" --post_content="Una de las bodegas más emblemáticas de San Rafael. Ofrecemos catas, recorridos por los viñedos y una experiencia inolvidable. Abierto de 9 a 18 hs." --post_status="publish" || true
wp post create --post_type="listing" --post_title="Bodega Goyenechea" --post_content="Con más de 150 años de historia, elaboramos vinos de alta calidad. Conocé nuestras instalaciones en San Rafael y disfrutá de nuestra cava subterránea." --post_status="publish" || true
wp post create --post_type="listing" --post_title="Rafting en el Río Atuel" --post_content="Diversión garantizada en las aguas del Cañón del Atuel. Rápidos para toda la familia con guías y equipo completo." --post_status="publish" || true
wp post create --post_type="listing" --post_title="Trekking Valle Grande" --post_content="Recorrido guiado por los senderos de Valle Grande. Disfruta de espectaculares vistas panorámicas." --post_status="publish" || true

echo "ALL DONE"
