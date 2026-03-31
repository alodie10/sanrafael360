<?php
// cleanup_corrupted.php
$listings = get_posts([
    'post_type' => 'listing',
    'posts_per_page' => -1,
    's' => '?',
]);
echo "Found " . count($listings) . " corrupted listings.\n";
foreach ($listings as $post) {
    if (strpos($post->post_title, '?') !== false) {
        echo "Deleting ID: " . $post->ID . " - " . $post->post_title . "\n";
        wp_delete_post($post->ID, true);
    }
}
echo "Cleanup done.\n";
