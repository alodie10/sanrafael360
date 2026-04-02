$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"

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
