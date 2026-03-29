<?php
require_once(ABSPATH . 'wp-load.php');

global $wpdb;
echo "Searching for listings with multiple _gallery entries...\n";

$results = $wpdb->get_results("
    SELECT post_id, count(*) as count 
    FROM {$wpdb->postmeta} 
    WHERE meta_key = '_gallery' 
    GROUP BY post_id 
    HAVING count > 1 
    LIMIT 10
");

if (empty($results)) {
    echo "No listings found with multiple _gallery entries.\n";
    
    echo "\nSearching for ANY listing with _gallery meta...\n";
    $any = $wpdb->get_results("
        SELECT post_id, meta_value 
        FROM {$wpdb->postmeta} 
        WHERE meta_key = '_gallery' 
        LIMIT 10
    ");
    foreach ($any as $row) {
        echo "ID: {$row->post_id} | Value: {$row->meta_value}\n";
    }
} else {
    foreach ($results as $row) {
        echo "Listing ID: {$row->post_id} (Count: {$row->count})\n";
        $metas = get_post_meta($row->post_id, '_gallery', false);
        echo "Format for ID {$row->post_id}:\n";
        print_r($metas);
        echo "-------------------\n";
    }
}

echo "\nDONE_MULTI_SEARCH\n";
