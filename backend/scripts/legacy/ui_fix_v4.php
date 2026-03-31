
/**
 * UI Fix: Expand Category Dropdown and Fix Vertical Cuts (Final Aggressive v4)
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* Force visibility on ALL ancestors of the search bar */
        .main-search-input, 
        .main-search-input-item,
        .main-search-inner,
        .main-search-container,
        .main-search-container-inner {
            overflow: visible !important;
            height: auto !important;
        }

        /* Expand the 3rd search input item (Categories) on desktop */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 2.0 !important; /* Maximum space for subcategories */
            }
        }

        /* Chosen.js container adjustments */
        .main-search-input-item .chosen-container {
            width: 100% !important;
            font-size: 14px !important;
        }

        /* Dropdown panel: Ensure it can't be clipped at all */
        .chosen-container .chosen-drop {
            border-radius: 4px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
            z-index: 99999 !important;
            overflow: visible !important;
            position: absolute !important;
            top: 100% !important;
            background: #fff !important;
            min-width: 120% !important; /* Allow it to be wider than the field */
        }

        /* The actual list of results */
        .chosen-container .chosen-results {
            max-height: 550px !important; /* Sufficient for many subcategories */
            padding: 5px 0 !important;
            overflow-y: auto !important;
            display: block !important;
        }

        /* Fix for individual items being cut off */
        .chosen-container .chosen-results li {
            line-height: 2.0 !important; /* Maximum space between items */
            padding: 12px 20px !important;
            border-bottom: 1px solid #eee;
            clear: both !important;
            display: block !important;
        }

        /* Special indentation for subcategories (indented with - or space in Listeo) */
        .chosen-container .chosen-results li.group-option {
            padding-left: 35px !important;
            font-style: italic;
            color: #444;
        }

        .chosen-container .chosen-results li:last-child {
            padding-bottom: 25px !important; /* Force extra space at the very bottom */
        }
    </style>
    <?php
});
