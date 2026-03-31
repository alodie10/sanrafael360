
/**
 * UI Fix: Expand Category Dropdown for Spanish Translation
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* Expand the 3rd search input item (Categories) on desktop */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 1.5 !important;
            }
        }
        /* Ensure the Chosen.js container fills the available space */
        .main-search-input-item .chosen-container {
            width: 100% !important;
        }
        /* Extra padding for the text */
        .main-search-input-item .chosen-single span {
            padding-right: 25px !important;
        }
    </style>
    <?php
});
