<?php
/**
 * fetch_test_listings.php - Fetch IDs and Website URLs for 5 test listings
 */
require_once(ABSPATH . 'wp-load.php');

$args = [
    'post_type' => 'listing',
    'posts_per_page' => 5,
    'meta_query' => [
        [
            'key' => '_website',
            'value' => '',
            'compare' => '!='
        ]
    ]
];

$query = new WP_Query($args);
$results = [];

if ($query->have_posts()) {
    while ($query->have_posts()) {
        $query->the_post();
        $id = get_the_ID();
        $website = get_post_meta($id, '_website', true);
        $results[] = "$id|$website|" . get_the_title();
    }
}

echo implode("\n", $results);
echo "\nDONE\n";
