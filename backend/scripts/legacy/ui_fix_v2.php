
/**
 * UI Fix: Expand Category Dropdown and Fix Subcategories
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* Expand the 3rd search input item (Categories) on desktop */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 1.6 !important; /* Slightly more space for subcategories */
            }
        }
        /* Ensure the Chosen.js container fills the available space */
        .main-search-input-item .chosen-container {
            width: 100% !important;
            font-size: 15px !important; /* Slightly smaller font to fit translations */
        }
        /* Extra padding for the text */
        .main-search-input-item .chosen-single span {
            padding-right: 25px !important;
        }
        /* Fix for last subcategory partially displayed */
        .chosen-container .chosen-drop {
            border-radius: 4px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .chosen-container .chosen-results {
            max-height: 400px !important; /* Increased limit for longer lists */
            padding: 5px 0 !important;
        }
        .chosen-container .chosen-results li {
            line-height: 1.6 !important; /* More breathing room */
            padding: 8px 20px !important;
        }
    </style>
    <?php
});
