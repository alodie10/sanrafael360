<?php
require_once(ABSPATH . 'wp-load.php');

function fix_listing_gallery($pid, $ids) {
    $gallery = array();
    foreach ($ids as $id) {
        $url = wp_get_attachment_url($id);
        if ($url) {
            $gallery[$id] = $url;
        }
    }
    update_post_meta($pid, '_gallery', $gallery);
    echo "Updated Listing $pid gallery with " . count($gallery) . " items.\n";
}

fix_listing_gallery(3326, [3860, 3861, 3862, 3863]);
fix_listing_gallery(3294, [3859]);

echo "DONE_FIX_GALLERY\n";
