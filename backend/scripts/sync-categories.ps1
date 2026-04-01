$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"
$MAPPING_PATH = "c:/sanrafael360/backend/scripts/csv_mapping.json"

$OLD_GOURMET_NAME = "Vinos, licores y conservas gourmet y artesanales"
$NEW_GOURMET_NAME = "Productos Gourmet"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[SYNC] Iniciando Deep Sync (Railway)..."

# 1. Obtener Categorias
try {
    $catResp = Invoke-RestMethod -Uri "$STRAPI_API_URL/categorias" -Method Get -Headers $headers
    $categoryIdMap = @{}
    foreach ($c in $catResp.data) {
        if ($c.nombre.Trim() -eq $OLD_GOURMET_NAME) {
            $categoryIdMap[$NEW_GOURMET_NAME] = $c.id
        } else {
            $categoryIdMap[$c.nombre.Trim()] = $c.id
        }
    }
} catch {
    Write-Error "Fallo al obtener categorias: $_"
    return
}

# 2. Obtener Negocios con Paginacion
$businessDocIdMap = @{}
$page = 1
$pageSize = 100
try {
    while ($true) {
        Write-Host "[INFO] Cargando negocios (Pagina $page)..."
        $url = "$STRAPI_API_URL/negocios?pagination[page]=$page&pagination[pageSize]=$pageSize"
        $negResp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        foreach ($n in $negResp.data) {
            $businessDocIdMap[$n.nombre.Trim()] = $n.documentId
        }
        if ($page -ge $negResp.meta.pagination.pageCount) { break }
        $page++
    }
} catch {
    Write-Error "Error en paginacion: $_"
    return
}
Write-Host "[OK] Mapeo completo: $($businessDocIdMap.Keys.Count) negocios cargados."

# 3. Procesar Mapeo JSON
if (-not (Test-Path $MAPPING_PATH)) { Write-Error "CSV no encontrado"; return }
try {
    $rawJson = Get-Content -Path $MAPPING_PATH -Raw -Encoding UTF8
    $mapping = $rawJson | ConvertFrom-Json
} catch {
    Write-Error "Fallo al procesar JSON: $_"
    return
}

Write-Host "[INFO] Iniciando vinculacion de $($mapping.Count) entradas..."

$count = 0
$errors = 0

foreach ($entry in $mapping) {
    if ($null -eq $entry.post_title -or $null -eq $entry.listing_category) { continue }
    $nombre = $entry.post_title.Trim()
    $categoriaName = $entry.listing_category.Trim()

    # Normalizacion Gourmet
    if ($nombre.ToLower().Contains("vinos") -or $categoriaName.ToLower().Contains("vinos") -or $categoriaName.ToLower().Contains("licores")) {
        $categoriaName = $NEW_GOURMET_NAME
    }

    $docId = $businessDocIdMap[$nombre]
    $catId = $categoryIdMap[$categoriaName]

    if ($docId -and $catId) {
        try {
            Write-Host "[LINK] ($($count + 1)) $nombre -> $categoriaName"
            $payload = @{ data = @{ categoria = $catId } } | ConvertTo-Json
            Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios/$docId" -Method Put -Headers $headers -Body $payload
            $count++
        } catch {
            $errors++
        }
    }
}

Write-Host "[FIN] Sincronizacion Finalizada."
Write-Host "[RESULT] $count negocios vinculados exitosamente."
