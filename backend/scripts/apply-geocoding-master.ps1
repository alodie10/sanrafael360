$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$csvPath = "c:\sanrafael360\backend\scripts\negocios_geocodificacion_maestra_V4.csv"

$headers = @{ 
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "Cargando datos desde $csvPath ..."
$data = Import-Csv $csvPath -Encoding utf8

$count = 0
$total = $data.Count

Write-Host "Iniciando actualización masiva de $total negocios..."

foreach ($row in $data) {
    if ($row.Status -ne "OK") { continue }
    
    $docId = $row.DocumentId
    $name = $row.Nombre
    $latVal = $null; $lngVal = $null
    
    # Parseo robusto de coordenadas
    if (![double]::TryParse($row.LatNueva, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$latVal)) { continue }
    if (![double]::TryParse($row.LngNueva, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$lngVal)) { continue }

    $body = @{ data = @{ latitud = $latVal; longitud = $lngVal } } | ConvertTo-Json -Depth 10 -Compress
    
    $url = "$STRAPI_API_URL/negocios/$docId"
    try {
        Invoke-RestMethod -Uri $url -Headers $headers -Method Put -Body $body > $null
        $count++
        $percent = [math]::Round(($count / $total) * 100, 1)
        Write-Host "[$percent%] OK: ${name} ($latVal, $lngVal)"
    } catch {
        Write-Host "Error actualizando ${name}: $($_.Exception.Message)"
    }

    # Throttle para estabilidad
    Start-Sleep -Milliseconds 100
}

Write-Host "------------------------------------------------"
Write-Host "Actualización masiva finalizada. $count registros procesados con éxito."
