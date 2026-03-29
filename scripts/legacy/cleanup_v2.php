<?php
// cleanup_v2.php - Run with 'wp eval-file cleanup_v2.php'
$keep_ids = [991, 993];
$listings = get_posts([
    'post_type'   => 'listing',
    'numberposts' => -1,
    'date_query'  => [
        ['after' => '2026-03-25 23:59:59']
    ],
    'fields'      => 'ids'
]);

echo "Found " . count($listings) . " listings created today.\n";
foreach ($listings as $id) {
    if (in_array($id, $keep_ids)) {
        echo "Keeping ID: $id\n";
        continue;
    }
    echo "Deleting ID: $id... ";
    wp_delete_post($id, true);
    echo "Done.\n";
}
echo "Cleanup completed.\n";
