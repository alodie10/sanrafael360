<?php
require_once(ABSPATH . 'wp-load.php');

$args = array(
    'post_type' => 'listing',
    'posts_per_page' => -1,
    'meta_query' => array(
        array(
            'key' => '_website',
            'value' => '',
            'compare' => '!='
        )
    ),
    'fields' => 'ids'
);

$ids = get_posts($args);
$data = array();

foreach ($ids as $id) {
    $website = get_post_meta($id, '_website', true);
    $data[] = array(
        'ID' => $id,
        'website' => $website,
        'title' => get_the_title($id)
    );
}

header('Content-Type: application/json');
echo json_encode($data);
