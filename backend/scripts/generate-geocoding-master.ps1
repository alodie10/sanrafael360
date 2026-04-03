$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$GOOGLE_MAPS_KEY = "AIzaSyCj9Y8mPBuCSxW0O2LEgj8nokX9pSAewgA"
$csvPath = "c:\sanrafael360\backend\scripts\negocios_geocodificacion_maestra_V3.csv"

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

Write-Host "Procesando $($allNegocios.Count) negocios con ESTRATEGIA V3 (Prioridad Nombre Estricta)..."

"Nombre,DocumentId,DireccionOriginal,LatActual,LngActual,LatNueva,LngNueva,Metodo,Status" | Out-File $csvPath -Encoding utf8

$successCount = 0
$errorCount = 0

foreach ($negocio in $allNegocios) {
    $nombre = $negocio.nombre
    $rawAddr = $negocio.direccion
    $docId = $negocio.documentId
    $latActual = $negocio.latitud
    $lngActual = $negocio.longitud

    $cleanAddr = Clean-Address $rawAddr
    
    $newLat = 0
    $newLng = 0
    $status = "FAIL"
    $metodo = "NONE"

    # 1. INTENTO POR NOMBRE SOLO (Prioridad Máxima para Lugares Específicos)
    $qName = [System.Net.WebUtility]::UrlEncode("$nombre, San Rafael, Mendoza, Argentina")
    try {
        $resp = Invoke-RestMethod -Uri "https://maps.googleapis.com/maps/api/geocode/json?address=$qName&key=$GOOGLE_MAPS_KEY"
        if ($resp.status -eq "OK") {
            $res = $resp.results[0]
            # Solo confiar si es un establecimiento o punto de interés, para evitar matcheos genéricos a la ciudad
            $isPlace = $false
            foreach ($type in $res.types) {
                if ($type -match "establishment|point_of_interest|lodging|restaurant|food|store|park|tourist_attraction") {
                    $isPlace = $true
                    break
                }
            }
            if ($isPlace) {
                $newLat = $res.geometry.location.lat
                $newLng = $res.geometry.location.lng
                $status = "OK"
                $metodo = "NOMBRE_ONLY"
            }
        }
    } catch { }

    # 2. INTENTO POR NOMBRE + DIRECCION (Si el anterior no fue concluyente)
    if ($status -ne "OK" -and ![string]::IsNullOrWhiteSpace($cleanAddr)) {
        $queries = @(
            "$nombre, $cleanAddr, San Rafael, Mendoza, Argentina",
            "$cleanAddr, San Rafael, Mendoza, Argentina"
        )
        foreach ($qStr in $queries) {
            $encoded = [System.Net.WebUtility]::UrlEncode($qStr)
            try {
                $resp = Invoke-RestMethod -Uri "https://maps.googleapis.com/maps/api/geocode/json?address=$encoded&key=$GOOGLE_MAPS_KEY"
                if ($resp.status -eq "OK") {
                    $newLat = $resp.results[0].geometry.location.lat
                    $newLng = $resp.results[0].geometry.location.lng
                    $status = "OK"
                    $metodo = if ($qStr -match $nombre) { "NOMBRE_DIRECCION" } else { "DIRECCION_ONLY" }
                    break
                }
            } catch { }
        }
    }

    if ($status -eq "OK") {
        Write-Host "OK: $nombre ($metodo) -> ($newLat, $newLng)"
        $successCount++
    } else {
        Write-Host "ERR: $nombre (Metodo: $metodo)"
        $errorCount++
    }

    $line = """$nombre"",""$docId"",""$rawAddr"",""$latActual"",""$lngActual"",""$newLat"",""$newLng"",""$metodo"",""$status"""
    $line | Out-File $csvPath -Append -Encoding utf8

    Start-Sleep -Milliseconds 100
}

Write-Host "Finalizado. Auditoria guardada en $csvPath"
Write-Host "Exito: $successCount, Error: $errorCount"
