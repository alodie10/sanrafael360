<?php
/**
 * import_gallery.php - Import local images to listing galleries
 * Run: wp eval-file import_gallery.php
 */

require_once(ABSPATH . 'wp-admin/includes/media.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/image.php');

$base_dir = 'galleries';
if (!is_dir($base_dir)) {
    die("Galleries directory not found.\n");
}

$pids = array_diff(scandir($base_dir), ['.', '..']);

foreach ($pids as $pid) {
    if (!is_numeric($pid)) continue;
    
    $pid_dir = "$base_dir/$pid";
    $files = array_diff(scandir($pid_dir), ['.', '..']);
    
    echo "Processing Listing $pid...\n";
    
    // We will re-process even if gallery exists to fix the incorrect format from previous run
    $gallery_ids = [];

    foreach ($files as $file) {
        if (!preg_match('/\.(jpg|jpeg|png|webp)$/i', $file)) continue;
        
        $filepath = "$pid_dir/$file";
        echo "  Importing $file...\n";
        
        $id = media_handle_sideload([
            'name' => "gallery_{$pid}_{$file}",
            'tmp_name' => $filepath,
            'copy' => true
        ], $pid);

        if (is_wp_error($id)) {
            echo "    Error: " . $id->get_error_message() . "\n";
        } else {
            $gallery_ids[] = $id;
            echo "    Success: Media ID $id\n";
        }
    }

    if (!empty($gallery_ids)) {
        // Listeo expects an associative array: [attachment_id => attachment_url]
        $gallery = [];
        foreach ($gallery_ids as $id) {
            $url = wp_get_attachment_url($id);
            if ($url) {
                $gallery[$id] = $url;
            }
        }
        update_post_meta($pid, '_gallery', $gallery);
        echo "  Gallery updated for $pid with " . count($gallery) . " items.\n";
    }
}

echo "Done.\n";
