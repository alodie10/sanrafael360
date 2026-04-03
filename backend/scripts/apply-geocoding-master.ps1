$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$CSV_PATH = "c:\sanrafael360\backend\scripts\negocios_geocodificacion_maestra.csv"

$headers = @{ 
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type"  = "application/json"
}

Write-Host "Cargando datos del CSV..."
$data = Import-Csv -Path $CSV_PATH

$success = 0
$errors = 0
$total = ($data | Where-Object { $_.Status -eq "OK" }).Count

Write-Host "Iniciando actualizacion de $total negocios..."

foreach ($row in $data) {
    if ($row.Status -ne "OK") { continue }

    $nombre = $row.Nombre
    $docId = $row.DocumentId
    
    # Limpiar coordenadas (asegurar punto decimal y quitar espacios)
    $latStr = $row.LatNueva.Trim() -replace ",", "."
    $lngStr = $row.LngNueva.Trim() -replace ",", "."
    
    $lat = 0
    $lng = 0
    if (-not [double]::TryParse($latStr, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$lat)) {
        Write-Host "Error de formato en Lat: $latStr para $nombre"
        $errors++
        continue
    }
    if (-not [double]::TryParse($lngStr, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$lng)) {
        Write-Host "Error de formato en Lng: $lngStr para $nombre"
        $errors++
        continue
    }

    $bodyObj = @{ data = @{ latitud = $lat; longitud = $lng } }
    $bodyJson = $bodyObj | ConvertTo-Json -Depth 10 -Compress

    $url = "$STRAPI_API_URL/negocios/$docId"
    
    try {
        $resp = Invoke-RestMethod -Uri $url -Headers $headers -Method Put -Body $bodyJson
        $success++
        $percent = [math]::Round(($success / $total) * 100, 1)
        Write-Host "[$percent%] OK: $nombre ($lat, $lng)"
    } catch {
        Write-Host "ERROR en $nombre ($docId): $($_.Exception.Message)"
        $errors++
    }

    Start-Sleep -Milliseconds 100
}

Write-Host "-------------------------------"
Write-Host "Finalizado."
Write-Host "Actualizados con exito: $success"
Write-Host "Errores: $errors"
