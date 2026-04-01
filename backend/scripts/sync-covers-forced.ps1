$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[SYNC-FORCED] Iniciando sincronización forzada de portadas en Railway..." -ForegroundColor Cyan

$page = 1
$count = 0
$totalUpdated = 0

while ($true) {
    try {
        $url = "$STRAPI_API_URL/negocios?populate[logo][fields]=id&pagination[page]=$page&pagination[pageSize]=100&sort=id:asc"
        $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        
        if ($null -eq $resp.data -or $resp.data.Count -eq 0) { break }

        foreach ($n in $resp.data) {
            $logoId = $n.logo.id
            $docId = $n.documentId

            if ($logoId) {
                Write-Host "SYNC ($($totalUpdated + 1)): $($n.nombre)..." -ForegroundColor Gray
                $payload = @{ data = @{ imagen_portada = $logoId } } | ConvertTo-Json
                Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios/$docId" -Method Put -Headers $headers -Body $payload
                $totalUpdated++
            }
        }
        
        Write-Host "Pagina $page completada..." -ForegroundColor Cyan
        
        if ($page -ge $resp.meta.pagination.pageCount) { break }
        $page++
    } catch {
        Write-Host "[ERR] Error en pagina $page : $($_.Exception.Message)" -ForegroundColor Red
        # Reintentar la misma pagina o salir depues de varios fallos?
        break
    }
}

Write-Host ""
Write-Host "[FIN] Proceso completado exitosamente. Total negocios actualizados: $totalUpdated" -ForegroundColor Green
