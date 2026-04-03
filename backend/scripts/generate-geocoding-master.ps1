$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$GOOGLE_MAPS_KEY = "AIzaSyCj9Y8mPBuCSxW0O2LEgj8nokX9pSAewgA"
$csvPath = "c:\sanrafael360\backend\scripts\negocios_geocodificacion_maestra_V2.csv"

function Clean-Address($addr) {
    if ($null -eq $addr) { return "" }
    $a = $addr.Trim()
    $a = $a -replace "(?i)^Domicilio\s*", ""
    $a = $a -replace "(?i)^Ubicaci[oó]n\s*\d*\s*", ""
    $a = $a -replace [char]0x2013, "-" -replace [char]0x2014, "-"
    $a = $a -replace "(?i)-\s*Ciudad", ""
    return $a.Trim()
}

$headers = @{ "Authorization" = "Bearer $API_TOKEN" }
$allNegocios = @()
$currentPage = 1
$pageSize = 100

Write-Host "Cargando negocios desde Strapi..."
do {
    $url = $STRAPI_API_URL + "/negocios?pagination[page]=$currentPage&pagination[pageSize]=$pageSize"
    try {
        $resp = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        $allNegocios += $resp.data
        $pageCount = $resp.meta.pagination.pageCount
        $currentPage++
    } catch {
        Write-Host "Error cargando pagina $currentPage : $_"
        break
    }
} while ($currentPage -le $pageCount)

Write-Host "Procesando $($allNegocios.Count) negocios con prioridad de Nombre..."

"Nombre,DocumentId,DireccionOriginal,LatActual,LngActual,LatNueva,LngNueva,Status" | Out-File $csvPath -Encoding utf8

$successCount = 0
$errorCount = 0

foreach ($negocio in $allNegocios) {
    $nombre = $negocio.nombre
    $rawAddr = $negocio.direccion
    $docId = $negocio.documentId
    $latActual = $negocio.latitud
    $lngActual = $negocio.longitud

    if ([string]::IsNullOrWhiteSpace($rawAddr)) {
        $line = """$nombre"",""$docId"",""SIN DIRECCION"",""$latActual"",""$lngActual"",""$latActual"",""$lngActual"",""SKIP"""
        $line | Out-File $csvPath -Append -Encoding utf8
        continue
    }

    $cleanAddr = Clean-Address $rawAddr
    
    # ESTRATEGIA: 1. Nombre+Direccion, 2. Nombre solo, 3. Direccion sola
    $queries = @(
        "$nombre, $cleanAddr, San Rafael, Mendoza, Argentina",
        "$nombre, San Rafael, Mendoza, Argentina",
        "$cleanAddr, San Rafael, Mendoza, Argentina"
    )

    $newLat = 0
    $newLng = 0
    $status = "FAIL"

    foreach ($searchQuery in $queries) {
        $encodedQuery = [System.Net.WebUtility]::UrlEncode($searchQuery)
        $geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=$encodedQuery&key=$GOOGLE_MAPS_KEY"

        try {
            $geoResp = Invoke-RestMethod -Uri $geoUrl -Method Get
            if ($geoResp.status -eq "OK") {
                $loc = $geoResp.results[0].geometry.location
                $newLat = $loc.lat
                $newLng = $loc.lng
                $status = "OK"
                break
            }
        } catch {
            $status = "EXCEPTION"
        }
    }

    if ($status -eq "OK") {
        Write-Host "OK: $nombre ($newLat, $newLng)"
        $successCount++
    } else {
        Write-Host "ERR: $nombre (Status: $status)"
        $errorCount++
    }

    $line = """$nombre"",""$docId"",""$rawAddr"",""$latActual"",""$lngActual"",""$newLat"",""$newLng"",""$status"""
    $line | Out-File $csvPath -Append -Encoding utf8

    Start-Sleep -Milliseconds 150
}

Write-Host "Finalizado. Auditoria guardada en $csvPath"
Write-Host "Exito: $successCount, Error: $errorCount"
