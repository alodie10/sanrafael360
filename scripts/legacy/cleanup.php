<?php
// cleanup.php - Run with 'wp eval-file cleanup.php'
$listings = get_posts([
    'post_type'   => 'listing',
    'numberposts' => -1,
    'date_query'  => [
        ['after' => '2026-03-25 23:59:59']
    ],
    'fields'      => 'ids'
]);

echo "Found " . count($listings) . " listings to delete.\n";
foreach ($listings as $id) {
    echo "Deleting ID: $id... ";
    wp_delete_post($id, true);
    echo "Done.\n";
}
echo "Cleanup completed.\n";
