$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[SYNC-COVERS] Iniciando Sincronizacion de Portadas (Railway)..." -ForegroundColor Cyan

$page = 1
$count = 0
while ($true) {
    try {
        # Buscamos negocios poblando logo y portada para comparar
        $url = "$STRAPI_API_URL/negocios?populate[logo][fields]=id&populate[imagen_portada][fields]=id&pagination[page]=$page&pagination[pageSize]=100"
        $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        
        if ($null -eq $resp.data -or $resp.data.Count -eq 0) { break }

        foreach ($n in $resp.data) {
            $logoId = $n.logo.id
            $coverId = $n.imagen_portada.id
            $docId = $n.documentId

            # Si tiene logo pero NO tiene portada, usamos el mismo ID para la portada
            if ($logoId -and -not $coverId) {
                Write-Host "VINCULANDO PORTADA: $($n.nombre)..." -ForegroundColor Gray
                $payload = @{ data = @{ imagen_portada = $logoId } } | ConvertTo-Json
                Invoke-RestMethod -Uri "$STRAPI_API_URL/negocios/$docId" -Method Put -Headers $headers -Body $payload
                $count++
            }
        }
        
        if ($page -ge $resp.meta.pagination.pageCount) { break }
        $page++
    } catch {
        Write-Host "[ERR] Error en pagina $page : $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

Write-Host ""
Write-Host "[FIN] Proceso completado: $count portadas vinculadas exitosamente." -ForegroundColor Green
