<?php
/**
 * import_covers.php - Reliable image import for categories
 * Run: wp eval-file import_covers.php
 */

require_once(ABSPATH . 'wp-admin/includes/media.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

$mappings = [
    // Subcategorías
    111 => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fm=jpg&q=80', // Hoteles
    112 => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?fm=jpg&q=80', // Cabañas
    113 => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fm=jpg&q=80', // Apart Hoteles
    114 => 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?fm=jpg&q=80', // Hostels
    115 => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?fm=jpg&q=80', // Posadas
    110 => 'https://images.unsplash.com/photo-1560493676-04071c5f467b?fm=jpg&q=80', // Bodegas
    116 => 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?fm=jpg&q=80', // Agencias de Viaje
    // Categorías Padres (reponiendo las que faltan)
    32  => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fm=jpg&q=80', // Alojamiento (Luxury Hotel)
    22  => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?fm=jpg&q=80', // Gastronomía
    36  => 'https://images.unsplash.com/photo-1521791136064-7986c29596ad?fm=jpg&q=80', // Servicios (Professional Desk)
];

foreach ($mappings as $term_id => $url) {
    $term = get_term($term_id, 'listing_category');
    if (!$term || is_wp_error($term)) continue;

    echo "Importing for '{$term->name}'...\n";
    
    // Use download_url to handle redirects and get a temp path
    $tmp = download_url($url);
    if (is_wp_error($tmp)) {
        echo "Download failed for '{$term->name}': " . $tmp->get_error_message() . "\n";
        continue;
    }

    $file_array = [
        'name' => 'cat_' . $term_id . '.jpg',
        'tmp_name' => $tmp
    ];

    // Sideload to media library
    $id = media_handle_sideload($file_array, 0);

    // Clean up temp file
    if (file_exists($tmp)) @unlink($tmp);

    if (is_wp_error($id)) {
        echo "Sideload failed for '{$term->name}': " . $id->get_error_message() . "\n";
    } else {
        update_term_meta($term_id, '_cover', $id);
        echo "Success: Set cover for '{$term->name}' (ID $id)\n";
    }
}
echo "Done.\n";
