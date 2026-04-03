
$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$CSV_PATH = "c:/sanrafael360/backend/scripts/legacy/importar_listeo_geocodificado.csv"

# Normalización para comparaciones
function Normalize-Name($name) {
    if ($null -eq $name) { return "" }
    $n = $name.ToLower().Trim()
    $n = $n -replace "á", "a" -replace "é", "e" -replace "í", "i" -replace "ó", "o" -replace "ú", "u"
    $n = $n -replace [char]0x2013, "-" -replace [char]0x2014, "-"
    $n = $n -replace "\s+", " "
    return $n
}

# Sanitizar descripción (Robustez contra encoding y formatos)
function Sanitize-Description($desc) {
    if ($null -eq $desc) { return "" }
    # Usar comodines para caracteres acentuados para evitar fallos de encoding en el regex
    # Captura "Más información en:", "Más info:", etc. y la URL
    $pattern = "(?mi)(M.s informaci.n en:|M.s info en:|M.s info:|M.s informaci.n:|Ver m.s en:)?\s*https?://sanrafaelturismo\.gov\.ar/[^\s]*"
    $clean = $desc -replace $pattern, ""
    return $clean.Trim()
}

Write-Host "🚀 Iniciando SEGUNDA PASADA de corrección y limpieza profunda..." -ForegroundColor Cyan

# 1. Paginación
$headers = @{ "Authorization" = "Bearer $API_TOKEN" }
$allNegocios = @()
$currentPage = 1
$pageSize = 100

do {
    Write-Host "Cargando página $currentPage ..."
    try {
        $resp = Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios?pagination[page]=$currentPage&pagination[pageSize]=$pageSize" -Headers $headers -Method Get
        $allNegocios += $resp.data
        $pageCount = $resp.meta.pagination.pageCount
        $currentPage++
    } catch { break }
} while ($currentPage -le $pageCount)

# 2. CSV
$csv = Import-Csv -Path $CSV_PATH -Encoding UTF8

$csvMap = @{}
foreach ($row in $csv) {
    $norm = Normalize-Name $row.post_title
    if ($norm -ne "") { $csvMap[$norm] = $row }
}

$updated = 0

foreach ($negocio in $allNegocios) {
    $nombreNorm = Normalize-Name $negocio.nombre
    if (-not $csvMap.ContainsKey($nombreNorm)) { continue }

    $entry = $csvMap[$nombreNorm]
    $newLat = [double]$entry._geolocation_lat
    $newLng = [double]$entry._geolocation_long
    $newDesc = Sanitize-Description $entry.post_content

    # Solo actualizar si es necesario (coordenadas o descripción)
    # Sin embargo, para mayor seguridad, forzamos la actualización de descripción limpia
    
    Write-Host "🔄 Actualizando: $($negocio.nombre)..."
    
    $bodyObj = @{ data = @{ latitud = $newLat; longitud = $newLng; descripcion = $newDesc } }
    $bodyJson = $bodyObj | ConvertTo-Json -Depth 10 -Compress

    try {
        Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios/$($negocio.documentId)" `
                          -Headers @{ "Authorization" = "Bearer $API_TOKEN"; "Content-Type" = "application/json" } `
                          -Method Put `
                          -Body ([System.Text.Encoding]::UTF8.GetBytes($bodyJson)) `
                          -ErrorAction Stop
        $updated++
    } catch {
        Write-Host "❌ Fallo: $($negocio.nombre)" -ForegroundColor Red
    }
}

Write-Host "`n✨ Limpieza total finalizada: $updated negocios procesados." -ForegroundColor Green
