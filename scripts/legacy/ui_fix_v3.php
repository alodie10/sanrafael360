
/**
 * UI Fix: Expand Category Dropdown and Fix Subcategories (Aggressive Fix v2)
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* Main search container overflow fix */
        .main-search-input, 
        .main-search-input-item {
            overflow: visible !important;
        }

        /* Expand the 3rd search input item (Categories) on desktop */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 1.8 !important; /* Increased from 1.6 to better fit subcategories */
            }
        }

        /* Chosen.js container adjustments */
        .main-search-input-item .chosen-container {
            width: 100% !important;
            font-size: 14px !important; /* Reduced to 14px for better fit */
        }

        /* Ensure the dropdown list is not clipped by any parent */
        .chosen-container .chosen-drop {
            border-radius: 4px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            z-index: 99999 !important;
            overflow: visible !important;
            min-width: 100% !important; /* Prevents text from being cut off horizontally */
        }

        .chosen-container .chosen-results {
            max-height: 500px !important; /* Increased limit */
            padding: 5px 0 !important;
            overflow-y: auto !important;
        }

        /* Subcategory styling (Gastronomía > Restaurante) */
        .chosen-container .chosen-results li.group-option {
            padding-left: 30px !important; /* Indentation for subcategories */
            font-style: italic;
            color: #666;
        }

        .chosen-container .chosen-results li {
            line-height: 1.8 !important; /* More space between items */
            padding: 10px 20px !important;
            border-bottom: 1px solid #f9f9f9;
        }

        .chosen-container .chosen-results li:last-child {
            border-bottom: none;
            padding-bottom: 15px !important; /* Force space at the bottom */
        }
    </style>
    <?php
});
