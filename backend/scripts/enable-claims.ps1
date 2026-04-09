
$headers = @{ 
    "Authorization" = "Bearer 15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635"
    "Content-Type"  = "application/json"
}

Write-Host "🚀 Iniciando habilitación masiva de reclamos en Railway (Loop Completo)..." -ForegroundColor Cyan

$page = 1
$pageSize = 100
$allProcessed = $false

while (-not $allProcessed) {
    Write-Host "`n📄 Procesando Página $page..." -ForegroundColor Blue
    $uri = "https://sanrafael360-production.up.railway.app/api/negocios?pagination[page]=$page&pagination[pageSize]=$pageSize"
    $response = Invoke-RestMethod -Uri $uri -Headers $headers
    
    $businesses = $response.data
    if ($null -eq $businesses -or $businesses.Count -eq 0) {
        $allProcessed = $true
        break
    }

    $total = $response.meta.pagination.total
    $currentCount = $businesses.Count

    foreach ($biz in $businesses) {
        if ($biz.reclamar_habilitado -eq $true) {
            # Skip already enabled
            continue
        }

        Write-Host " -> UPDATING: $($biz.nombre)..." -ForegroundColor Yellow
        
        $body = @{
            data = @{
                reclamar_habilitado = $true
            }
        } | ConvertTo-Json

        try {
            $updatePath = "https://sanrafael360-production.up.railway.app/api/negocios/$($biz.documentId)"
            Invoke-RestMethod -Method Put -Uri $updatePath -Headers $headers -Body $body > $null
        } catch {
            Write-Host " [!] FAILED: $($biz.nombre) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    if ($page -ge $response.meta.pagination.pageCount) {
        $allProcessed = $true
    } else {
        $page++
    }
}

Write-Host "`n✅ Finalizado: Todos los negocios procesados (Total: $total)." -ForegroundColor Yellow
