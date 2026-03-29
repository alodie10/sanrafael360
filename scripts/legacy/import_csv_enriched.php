<?php
// import_csv_enriched.php - Update/Create listings from CSV
// Run with: wp eval-file import_csv_enriched.php

$csv_file = 'import_test_enriched_60.csv';
if (!file_exists($csv_file)) {
    die("Error: $csv_file not found.\n");
}

function get_csv_data($file) {
    $rows = [];
    if (($handle = fopen($file, "r")) !== FALSE) {
        $header = fgetcsv($handle, 0, ",");
        // Remove BOM if exists
        if (substr($header[0], 0, 3) == "\xEF\xBB\xBF") {
            $header[0] = substr($header[0], 3);
        }
        while (($data = fgetcsv($handle, 0, ",")) !== FALSE) {
            if (count($header) == count($data)) {
                $rows[] = array_combine($header, $data);
            }
        }
        fclose($handle);
    }
    return $rows;
}

$data = get_csv_data($csv_file);
echo "Starting update/import of " . count($data) . " businesses...\n";

foreach ($data as $i => $item) {
    $name = $item['post_title'];
    echo "[$i] Processing: '$name'...\n";

    // Check if post exists
    $existing = get_page_by_title($name, OBJECT, 'listing');
    $post_id = 0;

    if ($existing) {
        $post_id = $existing->ID;
        echo "    Existing ID: $post_id. Updating...\n";
        // Update content if needed
        wp_update_post([
            'ID'           => $post_id,
            'post_content' => $item['post_content']
        ]);
    } else {
        // Create new
        $post_id = wp_insert_post([
            'post_title'   => $name,
            'post_content' => $item['post_content'],
            'post_status'  => 'publish',
            'post_type'    => 'listing',
            'post_author'  => 1
        ]);
        if (is_wp_error($post_id)) {
            echo "    Error creating: " . $post_id->get_error_message() . "\n";
            continue;
        }
        echo "    Created New ID: $post_id\n";
    }

    // Set Meta
    update_post_meta($post_id, '_address', $item['_address']);
    update_post_meta($post_id, '_friendly_address', $item['_address']);
    update_post_meta($post_id, '_phone', $item['_phone']);
    update_post_meta($post_id, '_whatsapp', $item['_whatsapp']);
    update_post_meta($post_id, '_facebook', $item['_facebook']);
    update_post_meta($post_id, '_instagram', $item['_instagram']);
    update_post_meta($post_id, '_website', $item['_website']);
    update_post_meta($post_id, '_email', $item['_email']);
    
    if (!empty($item['_geolocation_lat'])) {
        update_post_meta($post_id, '_geolocation_lat', $item['_geolocation_lat']);
        update_post_meta($post_id, '_geolocation_long', $item['_geolocation_long']);
    }

    // Media Handling
    $has_thumb = get_post_thumbnail_id($post_id);
    if (!$has_thumb && !empty($item['_thumbnail_id'])) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $media_id = media_sideload_image($item['_thumbnail_id'], $post_id, $name, 'id');
        if (!is_wp_error($media_id)) {
            set_post_thumbnail($post_id, $media_id);
            update_post_meta($post_id, '_thumbnail_id', $media_id);
            echo "    Media imported: $media_id\n";
        } else {
            echo "    Warning: Media failed: " . $media_id->get_error_message() . "\n";
        }
    }
}
echo "Process completed.\n";
