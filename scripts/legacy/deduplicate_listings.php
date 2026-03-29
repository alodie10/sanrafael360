<?php
/**
 * deduplicate_listings.php
 * Script para eliminar anuncios duplicados manteniendo el que tenga más información.
 * Ejecutar con: wp eval-file deduplicate_listings.php
 */

if (!defined('ABSPATH')) {
    die("This script must be run within a WordPress environment.\n");
}

$args = [
    'post_type'      => 'listing',
    'post_status'    => 'any',
    'numberposts'    => -1,
    'orderby'        => 'title',
    'order'          => 'ASC',
];

$listings = get_posts($args);

if (empty($listings)) {
    die("No listings found.\n");
}

$grouped = [];
foreach ($listings as $listing) {
    $title = trim($listing->post_title);
    $grouped[$title][] = $listing;
}

$total_deleted = 0;

foreach ($grouped as $title => $duplicates) {
    if (count($duplicates) <= 1) {
        continue;
    }

    echo "Found " . count($duplicates) . " duplicates for: '$title'\n";

    $best_id = null;
    $max_score = -1;

    $scores = [];

    foreach ($duplicates as $listing) {
        $id = $listing->ID;
        $score = 0;
        
        // Campos clave para puntuar
        $meta_fields = [
            '_address', '_phone', '_whatsapp', '_email', '_website', 
            '_instagram', '_facebook', '_geolocation_lat', '_geolocation_long', 
            '_thumbnail_id', '_gallery'
        ];

        foreach ($meta_fields as $field) {
            $value = get_post_meta($id, $field, true);
            if (!empty($value) && $value !== 'es') {
                $score++;
            }
        }
        
        // Bonus por tener contenido
        if (!empty($listing->post_content)) {
            $score += 1;
        }

        $scores[$id] = $score;

        if ($score > $max_score) {
            $max_score = $score;
            $best_id = $id;
        } elseif ($score === $max_score) {
            // Si el score es igual, nos quedamos con el más reciente
            $best_id = $id; 
        }
    }

    echo "  Winning ID: $best_id (Score: $max_score)\n";

    foreach ($duplicates as $listing) {
        if ($listing->ID !== $best_id) {
            echo "  Deleting ID: {$listing->ID} (Score: {$scores[$listing->ID]})... ";
            wp_delete_post($listing->ID, true); // true = permanent bypass trash
            echo "Done.\n";
            $total_deleted++;
        }
    }
}

echo "\nDeduplication completed. Total records deleted: $total_deleted\n";
