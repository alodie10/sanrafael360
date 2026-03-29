
/**
 * UI Fix: Final Structural Release (v5) - Liberar menú del contenedor blanco
 */
add_action('wp_head', function() {
    ?>
    <style id="category-dropdown-ui-fix">
        /* El contenedor principal blanco (Pill) DEBE permitir desbordamiento */
        .main-search-input, 
        .main-search-input-item,
        .main-search-inner,
        .main-search-container,
        .main-search-container-inner,
        .header-search-form,
        .hero-search-inner {
            overflow: visible !important;
            height: auto !important;
            contain: unset !important;
        }

        /* Expand the 3rd search input item (Categories) on desktop */
        @media (min-width: 992px) {
            .main-search-input .main-search-input-item:nth-child(3) {
                flex: 2.2 !important; /* Más ancho para subcategorías largas */
            }
        }

        /* Chosen.js container: Estructura corregida */
        .main-search-input-item .chosen-container {
            width: 100% !important;
            font-size: 14px !important;
            position: relative !important;
        }

        /* Dropdown panel: LIBERACIÓN TOTAL */
        .chosen-container .chosen-drop {
            border-radius: 8px !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.25) !important; /* Sombra más fuerte para flotar */
            z-index: 100000 !important; /* Por encima de todo */
            overflow: visible !important;
            position: absolute !important;
            top: 100% !important; /* Justo debajo de la barra */
            left: 0 !important;
            background: #fff !important;
            min-width: 130% !important; /* Desborde lateral permitido */
            margin-top: 10px !important; /* Separación de la barra */
        }

        /* Resultados de la lista */
        .chosen-container .chosen-results {
            max-height: 550px !important;
            padding: 10px 0 !important;
            overflow-y: auto !important;
            display: block !important;
        }

        /* Elementos de la lista */
        .chosen-container .chosen-results li {
            line-height: 2.2 !important; /* Más espacio vertical */
            padding: 12px 25px !important;
            border-bottom: 1px solid #eee;
            clear: both !important;
            display: block !important;
            width: 100% !important;
        }

        /* Sangría para subcategorías */
        .chosen-container .chosen-results li.group-option {
            padding-left: 45px !important;
            font-weight: normal !important;
            color: #555 !important;
        }

        /* Espacio final crítico para evitar recortes por el borde del viewport o barra */
        .chosen-container .chosen-results li:last-child {
            padding-bottom: 30px !important;
            border-bottom: none;
        }
    </style>
    <?php
});
