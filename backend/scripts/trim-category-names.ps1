$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[TRIM-CATEGORIES] Normalizando nombres en Railway..." -ForegroundColor Cyan

try {
    # 1. Obtener todas las categorías
    $url = "$STRAPI_API_URL/categorias?fields[0]=nombre"
    $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers

    $count = 0
    foreach ($cat in $resp.data) {
        $trimmedName = $cat.nombre.Trim()
        $docId = $cat.documentId
        
        if ($cat.nombre -ne $trimmedName) {
            Write-Host "MODIFICANDO: '$($cat.nombre)' -> '$trimmedName'" -ForegroundColor Yellow
            $payload = @{ data = @{ nombre = $trimmedName } } | ConvertTo-Json
            Invoke-RestMethod -Uri "$STRAPI_API_URL/categorias/$docId" -Method Put -Headers $headers -Body $payload
            $count++
        } else {
            Write-Host "CORRECTO: '$trimmedName'" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "[FIN] Proceso completado. Categorias normalizadas: $count" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Error al normalizar: $($_.Exception.Message)" -ForegroundColor Red
}
