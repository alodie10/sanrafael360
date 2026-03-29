<?php
// set_category_images.php - Download and set cover images for categories
// Run with: wp eval-file set_category_images.php

require_once(ABSPATH . 'wp-admin/includes/media.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

$mappings = [
    111 => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', // Hoteles
    112 => 'https://images.unsplash.com/photo-1449156001533-cb39c71994e6?auto=format&fit=crop&w=1200&q=80', // Cabañas
    113 => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', // Apart Hoteles
    114 => 'https://images.unsplash.com/photo-1555854816-808226a3f14b?auto=format&fit=crop&w=1200&q=80', // Hostels
    115 => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', // Posadas
    110 => 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80', // Bodegas
    116 => 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80', // Agencias de Viaje
];

foreach ($mappings as $term_id => $url) {
    echo "Processing Category ID $term_id...\n";
    $term = get_term($term_id, 'listing_category');
    if (!$term || is_wp_error($term)) {
        echo "Error: Category $term_id not found.\n";
        continue;
    }

    echo "Downloading image for '{$term->name}'...\n";
    $img_id = media_sideload_image($url, 0, "Cover for {$term->name}", 'id');

    if (is_wp_error($img_id)) {
        echo "Failed to upload image for '{$term->name}': " . $img_id->get_error_message() . "\n";
    } else {
        update_term_meta($term_id, '_cover', $img_id);
        echo "Successfully set cover for '{$term->name}' to Media ID $img_id.\n";
    }
}
echo "Process completed.\n";
