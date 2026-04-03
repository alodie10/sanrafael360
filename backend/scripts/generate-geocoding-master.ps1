$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$GOOGLE_MAPS_KEY = "AIzaSyCj9Y8mPBuCSxW0O2LEgj8nokX9pSAewgA"
$OUTPUT_FILE = "c:\sanrafael360\backend\scripts\negocios_geocodificacion_maestra.csv"

function Clean-Address($addr) {
    if ($null -eq $addr) { return "" }
    $a = $addr.Trim()
    $a = $a -replace "(?i)^Domicilio\s*", ""
    $a = $a -replace "(?i)^Ubicaci[oó]n\s*\d*\s*", ""
    # Remover guiones largos
    $a = $a -replace [char]0x2013, "-"
    $a = $a -replace [char]0x2014, "-"
    $a = $a -replace "(?i)-\s*Ciudad", ""
    return $a.Trim()
}

$headers = @{ "Authorization" = "Bearer $API_TOKEN" }
$allNegocios = @()
$currentPage = 1
$pageSize = 100

Write-Host "Cargando negocios desde Strapi..."
do {
    $url = $STRAPI_API_URL + "/negocios?pagination[page]=" + $currentPage + "&pagination[pageSize]=" + $pageSize
    $resp = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    $allNegocios += $resp.data
    $pageCount = $resp.meta.pagination.pageCount
    $currentPage++
} while ($currentPage -le $pageCount)

Write-Host "Procesando $($allNegocios.Count) negocios con Google Maps..."
$auditData = @()

foreach ($n in $allNegocios) {
    if ($null -eq $n) { continue }
    $nombre = $n.nombre
    $docId = $n.documentId
    $direccion = $n.direccion
    $latActual = $n.latitud
    $lngActual = $n.longitud
    
    if ([string]::IsNullOrWhiteSpace($direccion)) {
        $auditData += [PSCustomObject]@{
            Nombre = $nombre
            DocumentId = $docId
            Direccion = "SIN DIRECCION"
            LatActual = $latActual
            LngActual = $lngActual
            LatNueva = $latActual
            LngNueva = $lngActual
            Status = "SKIP"
        }
        continue
    }

    $cleanAddr = Clean-Address $direccion
    $query = $cleanAddr + ", San Rafael, Mendoza, Argentina"
    $encodedQuery = [System.Net.WebUtility]::UrlEncode($query)
    $geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $encodedQuery + "&key=" + $GOOGLE_MAPS_KEY

    try {
        $geoResp = Invoke-RestMethod -Uri $geoUrl -Method Get
        if ($geoResp.status -eq "OK") {
            $loc = $geoResp.results[0].geometry.location
            $auditData += [PSCustomObject]@{
                Nombre = $nombre
                DocumentId = $docId
                Direccion = $direccion
                LatActual = $latActual
                LngActual = $lngActual
                LatNueva = $loc.lat
                LngNueva = $loc.lng
                Status = "OK"
            }
            Write-Host "OK: $nombre"
        } else {
            $auditData += [PSCustomObject]@{
                Nombre = $nombre
                DocumentId = $docId
                Direccion = $direccion
                LatActual = $latActual
                LngActual = $lngActual
                LatNueva = $latActual
                LngNueva = $lngActual
                Status = "FAIL (" + $geoResp.status + ")"
            }
            Write-Host ("FAIL: " + $nombre + " (" + $geoResp.status + ")")
        }
    } catch {
        $auditData += [PSCustomObject]@{
            Nombre = $nombre
            DocumentId = $docId
            Direccion = $direccion
            LatActual = $latActual
            LngActual = $lngActual
            LatNueva = $latActual
            LngNueva = $lngActual
            Status = "ERROR"
        }
        Write-Host "ERROR: $nombre"
    }
    
    Start-Sleep -Milliseconds 100
}

$auditData | Export-Csv -Path $OUTPUT_FILE -NoTypeInformation -Encoding UTF8
Write-Host "Archivo de auditoria generado en: $OUTPUT_FILE"
