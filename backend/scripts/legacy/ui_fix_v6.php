
/**
 * UI Fix: Final Structural Release and JS Override (v6 - Nuclear Force)
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* El contenedor principal blanco y Elementor wrappers DEBEN permitir desbordamiento */
        .main-search-input, 
        .main-search-input-item,
        .main-search-inner,
        .simple-slider-search-form,
        .elementor-section,
        .elementor-container,
        .elementor-widget-wrap {
            overflow: visible !important;
            contain: none !important;
            clip-path: none !important;
        }

        /* Ancho máximo para categorías largas */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 2.3 !important;
            }
        }

        .main-search-input-item .chosen-container {
            width: 100% !important;
            font-size: 14px !important;
            position: relative !important;
        }

        /* Dropdown panel: Liberación extrema */
        .chosen-container .chosen-drop {
            border-radius: 8px !important;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important;
            z-index: 2147483647 !important; /* Tope absoluto de z-index */
            overflow: visible !important;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            background: #fff !important;
            min-width: 130% !important;
            margin-top: 10px !important;
        }

        /* 
         * RESULTADOS - OPCIÓN NUCLEAR CONTRA JAVASCRIPT
         * Si JS calcula una altura pequeña y reduce el cuadro (shrink), 
         * min-height ignorará esa orden matemática del script. 
         */
        .chosen-container .chosen-results {
            min-height: 480px !important;  /** <--- REGLA DE DOMINANCIA JAVASCRIPT **/
            max-height: 600px !important;
            padding: 10px 0 !important;
            overflow-y: auto !important;
            display: block !important;
        }

        /* Elementos de la lista */
        .chosen-container .chosen-results li {
            line-height: 2.2 !important;
            padding: 12px 25px !important;
            border-bottom: 1px solid #f6f6f6;
            clear: both !important;
            display: block !important;
            width: 100% !important;
        }

        /* Sangría para subcategorías como 'Restaurante' */
        .chosen-container .chosen-results li.group-option {
            padding-left: 50px !important; /* Más profundo visualmente */
            font-weight: 500 !important;
            color: #d90a2c !important; /* Resalta en rojo estilo Listeo */
        }

        /* Espacio final crítico */
        .chosen-container .chosen-results li:last-child {
            padding-bottom: 40px !important;
            border-bottom: none;
        }
    </style>
    <?php
});
