$STRAPI_API_URL = "https://sanrafael360-production.up.railway.app/api"
$API_TOKEN = "6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b"

# DocumentId detectado para 'Licores y Conservas...'
$TARGET_DOCUMENT_ID = "dxyq11eomysmg6rjy2qj0m33"
$NEW_NAME = "Productos Gourmet"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[FIX] Corrigiendo nombre de categoria Gourmet en Railway..." -ForegroundColor Cyan

try {
    $payload = @{ data = @{ nombre = $NEW_NAME } } | ConvertTo-Json
    $url = "$STRAPI_API_URL/categorias/$TARGET_DOCUMENT_ID"
    $resp = Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $payload
    
    Write-Host "[OK] Renombrado exitoso: $($resp.data.nombre)" -ForegroundColor Green
} catch {
    Write-Error "Fallo al realizar el renombrado: $_"
}
