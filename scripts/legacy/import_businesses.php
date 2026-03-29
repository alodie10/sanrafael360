<?php
// import_businesses.php - To be run with 'wp eval-file import_businesses.php'

$json_file = 'businesses.json';
if (!file_exists($json_file)) {
    die("Error: $json_file not found.\n");
}

$data = json_decode(file_get_contents($json_file), true);
if (!$data) {
    die("Error: Failed to decode JSON.\n");
}

$limit = getenv('IMPORT_LIMIT') ?: count($data);
$offset = getenv('IMPORT_OFFSET') ?: 0;

echo "Starting import (Offset: $offset, Limit: $limit) of " . count($data) . " businesses total...\n";

$data_slice = array_slice($data, $offset, $limit);

foreach ($data_slice as $i => $item) {
    $index = $offset + $i;
    $name = $item['name'];
    $cat_id = (int)$item['category_id'];
    
    // Check if post exists
    $existing = get_page_by_title($name, OBJECT, 'listing');
    if ($existing) {
        echo "[$index] Skipping: '$name' (Already exists ID: {$existing->ID})\n";
        continue;
    }

    // Create post
    $post_id = wp_insert_post([
        'post_title'   => $name,
        'post_content' => $item['description'] ?: '',
        'post_status'  => 'publish',
        'post_type'    => 'listing',
        'post_author'  => 1
    ]);

    if (is_wp_error($post_id)) {
        echo "[$index] Error creating '$name': " . $post_id->get_error_message() . "\n";
        continue;
    }

    // Set Categories
    wp_set_object_terms($post_id, [$cat_id], 'listing_category');

    // Set Meta
    update_post_meta($post_id, '_address', $item['address']);
    update_post_meta($post_id, '_friendly_address', $item['address']);
    update_post_meta($post_id, '_phone', $item['phone']);
    update_post_meta($post_id, '_whatsapp', $item['whatsapp']);
    update_post_meta($post_id, '_facebook', $item['facebook']);
    update_post_meta($post_id, '_instagram', $item['instagram']);
    update_post_meta($post_id, '_website', $item['website']);
    
    // Import Media
    if (!empty($item['image_url'])) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $media_id = media_sideload_image($item['image_url'], $post_id, $name, 'id');
        if (!is_wp_error($media_id)) {
            set_post_thumbnail($post_id, $media_id);
            update_post_meta($post_id, '_thumbnail_id', $media_id);
        } else {
            echo "[$index] Warning: Media import failed for '$name' ({$item['image_url']}): " . $media_id->get_error_message() . "\n";
        }
    }

    echo "[$index] Created: '$name' (ID: $post_id)\n";
}

echo "Batch completed.\n";
