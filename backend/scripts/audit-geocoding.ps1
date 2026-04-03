
$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
$GOOGLE_MAPS_KEY = "AIzaSyCj9Y8mPBuCSxW0O2LEgj8nokX9pSAewgA"

function Clean-Address($addr) {
    if ($null -eq $addr) { return "" }
    $a = $addr.Trim()
    # Remover prefijos comunes
    $a = $a -replace "(?i)^Domicilio\s*", ""
    $a = $a -replace "(?i)^Ubicaci.n\s*\d*\s*", ""
    $a = $a -replace [char]0x2013, "-" -replace [char]0x2014, "-"
    $a = $a -replace "(?i)-\s*Ciudad", ""
    return $a.Trim()
}

Write-Host "Geocodificando con Google Maps API..."

# 1. Obtener todos los negocios
$headers = @{ "Authorization" = "Bearer $API_TOKEN" }
$allNegocios = @()
$currentPage = 1
$pageSize = 100

do {
    Write-Host "Cargando pagina $currentPage ..."
    try {
        $resp = Invoke-RestMethod -Uri ($STRAPI_API_URL + "/negocios?pagination[page]=" + $currentPage + "&pagination[pageSize]=" + $pageSize) -Headers $headers -Method Get
        $allNegocios += $resp.data
        $pageCount = $resp.meta.pagination.pageCount
        $currentPage++
    } catch {
        Write-Host "Error cargando negocios: $_"
        break
    }
} while ($currentPage -le $pageCount)

$successCount = 0
$errorCount = 0

foreach ($negocio in $allNegocios) {
    $rawAddr = $negocio.direccion
    if ([string]::IsNullOrWhiteSpace($rawAddr)) {
        continue
    }

    $cleanAddr = Clean-Address $rawAddr
    $searchQuery = $cleanAddr + ", San Rafael, Mendoza, Argentina"

    # Encoding
    $encodedQuery = [System.Net.WebUtility]::UrlEncode($searchQuery)
    $geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $encodedQuery + "&key=" + $GOOGLE_MAPS_KEY

    try {
        $geoResp = Invoke-RestMethod -Uri $geoUrl -Method Get
        if ($geoResp.status -eq "OK") {
            $loc = $geoResp.results[0].geometry.location
            $newLat = $loc.lat
            $newLng = $loc.lng

            Write-Host ("[" + ($successCount + $errorCount + 1) + "/" + $allNegocios.Count + "] OK: " + $negocio.nombre + " -> " + $newLat + ", " + $newLng) -ForegroundColor Green

            # Actualizar Strapi
            $bodyObj = @{ data = @{ latitud = $newLat; longitud = $newLng } }
            $bodyJson = $bodyObj | ConvertTo-Json -Depth 10 -Compress
            $updateUrl = $STRAPI_API_URL + "/negocios/" + $negocio.documentId
            $updateHeaders = @{ "Authorization" = "Bearer $API_TOKEN"; "Content-Type" = "application/json" }
            $updateRes = Invoke-RestMethod -Uri $updateUrl -Headers $updateHeaders -Method Put -Body ([System.Text.Encoding]::UTF8.GetBytes($bodyJson)) -ErrorAction Stop
            $successCount++
        } else {
            Write-Host ("[" + ($successCount + $errorCount + 1) + "/" + $allNegocios.Count + "] API " + $geoResp.status + ": " + $negocio.nombre + " (Addr: " + $cleanAddr + ")") -ForegroundColor Yellow
            $errorCount++
        }
    } catch {
        Write-Host ("[" + ($successCount + $errorCount + 1) + "/" + $allNegocios.Count + "] EXCEPTION: " + $negocio.nombre + " - " + $_.Exception.Message) -ForegroundColor Red
        $errorCount++
    }

    Start-Sleep -Milliseconds 150
}

Write-Host "Finalizado."
Write-Host ("Actualizados: " + $successCount)
Write-Host ("Errores: " + $errorCount)
