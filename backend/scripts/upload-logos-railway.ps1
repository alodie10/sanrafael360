$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"
$MAPPING_PATH = "c:/sanrafael360/backend/scripts/image_mapping.json"
$TMP_DIR = "c:/sanrafael360/backend/scripts/tmp_media"

if (-not (Test-Path $TMP_DIR)) { New-Item -ItemType Directory $TMP_DIR }

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
}

Write-Host "[MEDIA-SYNC] Iniciando Migracion de Logos (Railway)..." -ForegroundColor Cyan

# 1. Obtener Negocios (con Paginacion) para mapear DocumentIds
$businessMap = @{}
$page = 1
while ($true) {
    try {
        $url = "$STRAPI_API_URL/negocios?pagination[page]=$page&pagination[pageSize]=100"
        $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        foreach ($n in $resp.data) { $businessMap[$n.nombre.Trim()] = $n.documentId }
        if ($page -ge $resp.meta.pagination.pageCount) { break }
        $page++
    } catch { break }
}
Write-Host "[OK] Mapeados $($businessMap.Keys.Count) negocios." -ForegroundColor Green

# 2. Procesar Mapping de Imagenes
$mapping = Get-Content -Path $MAPPING_PATH -Raw -Encoding utf8 | ConvertFrom-Json
$count = 0

foreach ($entry in $mapping) {
    if ($null -eq $entry.post_title -or $null -eq $entry._thumbnail_id) { continue }
    
    $nombre = $entry.post_title.Trim()
    $imgUrl = $entry._thumbnail_id.Trim()
    $docId = $businessMap[$nombre]

    if (-not $docId) { continue }

    try {
        Write-Host "MIGRANDO: $nombre ..." -ForegroundColor Gray
        
        # Descarga Temporal
        $fileName = [System.IO.Path]::GetFileName($imgUrl)
        $localPath = Join-Path $TMP_DIR $fileName
        Invoke-WebRequest -Uri $imgUrl -OutFile $localPath

        # Subida a Strapi (Usando multipart/form-data via curl para confiabilidad)
        # Nota: curl en PS es usualmente un alias de Invoke-WebRequest, 
        # pero usamos la sintaxis completa para ser claros.
        $uploadUrl = "$STRAPI_API_URL/upload"
        
        # Ejecutamos curl directamente (si esta disponible) o Invoke-RestMethod con multipart
        # Optamos por Invoke-RestMethod con boundary manual para maxima compatibilidad PS 5.1/7
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
        $fileHeader = "--$boundary$LF" +
                      "Content-Disposition: form-data; name=`"files`"; filename=`"$fileName`"$LF" +
                      "Content-Type: image/jpeg$LF$LF"
        $fileFooter = "$LF--$boundary--$LF"
        
        $encoding = [System.Text.Encoding]::GetEncoding("iso-8859-1")
        $headerBytes = $encoding.GetBytes($fileHeader)
        $footerBytes = $encoding.GetBytes($fileFooter)
        
        $bodyBytes = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
        [System.Buffer]::BlockCopy($headerBytes, 0, $bodyBytes, 0, $headerBytes.Length)
        [System.Buffer]::BlockCopy($fileBytes, 0, $bodyBytes, $headerBytes.Length, $fileBytes.Length)
        [System.Buffer]::BlockCopy($footerBytes, 0, $bodyBytes, ($headerBytes.Length + $fileBytes.Length), $footerBytes.Length)

        $uploadHeaders = @{
            "Authorization" = "Bearer $API_TOKEN"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }

        $uploadResp = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $bodyBytes
        $fileId = $uploadResp[0].id

        if ($fileId) {
            # Vinculacion al Negocio
            $payload = @{ data = @{ logo = $fileId } } | ConvertTo-Json
            Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios/$docId" -Method Put -Headers $headers -ContentType "application/json" -Body $payload
            Write-Host "[OK] Vinculado: $nombre" -ForegroundColor Green
            $count++
        }
        
        # Limpieza
        Remove-Item $localPath
    } catch {
        Write-Host "[ERR] $nombre -> $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "[FIN] Proceso completado: $count logos migrados." -ForegroundColor Cyan
