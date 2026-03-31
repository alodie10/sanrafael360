<?php
// update_category_terms.php - Bulk update listing_category from CSV
// Run with: wp eval-file update_category_terms.php

$csv_file = 'category_updates.csv';
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
echo "Starting category update for " . count($data) . " businesses...\n";

foreach ($data as $i => $item) {
    $name = $item['Nombre'];
    $term_id = (int)$item['term_id'];

    if (!$term_id) {
        echo "[$i] Skipping: '$name' (No term_id found)\n";
        continue;
    }

    // Attempt to find post
    $existing = get_page_by_title($name, OBJECT, 'listing');
    if (!$existing) {
        // Try fallback: normalization of dashes
        $name_fallback = str_replace(['–', '—', '&#8211;', '&#8212;'], '-', $name);
        $existing = get_page_by_title($name_fallback, OBJECT, 'listing');
    }
    
    if (!$existing) {
        // Final fallback: Search by title (SQL LIKE)
        global $wpdb;
        $post_id = $wpdb->get_var($wpdb->prepare("SELECT ID FROM $wpdb->posts WHERE post_title = %s AND post_type = 'listing' LIMIT 1", $name));
        if ($post_id) $existing = get_post($post_id);
    }

    if ($existing) {
        $post_id = $existing->ID;
        // Get parent term of the term_id if any (for multi-category assignment)
        $term = get_term($term_id, 'listing_category');
        $terms_to_set = [$term_id];
        if ($term && $term->parent != 0) {
            $terms_to_set[] = $term->parent;
        }

        wp_set_object_terms($post_id, $terms_to_set, 'listing_category');
        echo "[$i] Updated: '$name' (ID: $post_id) -> Terms: " . implode(',', $terms_to_set) . "\n";
    } else {
        echo "[$i] Not found: '$name'\n";
    }
}
echo "Process completed.\n";
