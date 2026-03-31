<?php
/**
 * final_sync_covers.php - Final reliable sync of all category covers
 * Run: wp eval-file final_sync_covers.php
 */

require_once(ABSPATH . 'wp-admin/includes/media.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

$mappings = [
    // Parents
    32  => 'cat_32.jpg',    // Alojamiento
    22  => 'cat_22.jpg',    // Gastronomía
    36  => 'cat_36.jpg',    // Servicios
    110 => 'cat_110.jpg',   // Bodegas
    37  => 'cat_37.jpg',    // Eventos
    38  => 'cat_38.jpg',    // Otros
    43  => 'cat_43.jpg',    // Fitness
    // Children
    111 => 'cat_111.jpg',   // Hoteles
    112 => 'cat_112.jpg',   // Cabañas
    113 => 'cat_113.jpg',   // Apart Hoteles
    114 => 'cat_114.jpg',   // Hostels
    115 => 'cat_115.jpg',   // Posadas
    116 => 'cat_116.jpg',   // Agencias de Viaje
];

foreach ($mappings as $term_id => $filename) {
    if (!file_exists($filename)) {
        echo "Skipping $term_id: File $filename not found.\n";
        continue;
    }

    $term = get_term($term_id, 'listing_category');
    if (!$term || is_wp_error($term)) {
        echo "Skipping $term_id: Term not found.\n";
        continue;
    }

    echo "Syncing '{$term->name}'...\n";
    $id = media_handle_sideload([
        'name' => "cover_{$term_id}.jpg",
        'tmp_name' => $filename,
        'copy' => true // important so we don't delete the local file if it fails later
    ], 0);

    if (is_wp_error($id)) {
        echo "Error for '{$term->name}': " . $id->get_error_message() . "\n";
    } else {
        update_term_meta($term_id, '_cover', $id);
        echo "Success: '{$term->name}' -> Media ID $id\n";
    }
}
echo "Done.\n";
