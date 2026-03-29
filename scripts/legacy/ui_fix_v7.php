/**
 * UI Fix: Scrollbar Plugin Override (v7)
 */
add_action('wp_footer', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* Global Release */
        .main-search-input, .main-search-input-item, .main-search-inner, 
        .simple-slider-search-form, .elementor-section, .elementor-container, 
        .elementor-widget-wrap {
            overflow: visible !important;
            contain: unset !important;
        }

        /* Chosen Panel width & position */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) { flex: 2.3 !important; }
        }
        .main-search-input-item .chosen-container { width: 100% !important; font-size: 14px !important; }
        .chosen-container .chosen-drop {
            border-radius: 8px !important;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important;
            z-index: 2147483647 !important;
            overflow: visible !important;
            background: #fff !important;
        }

        /* THE FIX FOR DYNAMIC SCROLLBAR PLUGINS */
        .chosen-container .slimScrollDiv,
        .chosen-container .simplebar-content-wrapper,
        .chosen-container .simplebar-mask,
        .chosen-container .simplebar-track,
        .chosen-container .mCustomScrollBox,
        .chosen-container .mCSB_container {
            height: auto !important;
            max-height: 600px !important;
            overflow: visible !important;
        }
        
        .slimScrollDiv { overflow: visible !important; height: auto !important; }

        .chosen-container .chosen-results {
            max-height: 550px !important;
            overflow-y: auto !important;
        }

        /* Items */
        .chosen-container .chosen-results li {
            line-height: 2.2 !important; padding: 12px 25px !important; border-bottom: 1px solid #f6f6f6;
            clear: both !important; display: block !important; width: 100% !important;
        }
        .chosen-container .chosen-results li.group-option {
            padding-left: 50px !important; font-weight: 500 !important; color: #d90a2c !important;
        }
        .chosen-container .chosen-results li:last-child { padding-bottom: 40px !important; border-bottom: none; }
    </style>
    
    <script>
    jQuery(document).ready(function($) {
        $(document).on('chosen:showing_dropdown', function(evt, params) {
            setTimeout(function() {
                var results = $('.chosen-results');
                results.parent().css({
                    'height': 'auto',
                    'max-height': '550px',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                });
                results.css('max-height', '550px');
            }, 50);
            setTimeout(function() {
                $('.chosen-results').parent().css('height', 'auto');
            }, 300);
        });
    });
    </script>
    <?php
});
