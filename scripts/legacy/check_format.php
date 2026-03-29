<?php
require_once(ABSPATH . 'wp-load.php');
$meta = get_post_meta(1149, '_gallery', true);
echo "Type: " . gettype($meta) . "\n";
if (is_array($meta)) {
    echo "Array Content:\n";
    print_r($meta);
} else {
    echo "String Content: $meta\n";
}
echo "Serialized: " . serialize($meta) . "\n";
echo "DONE_FORMAT_CHECK\n";
