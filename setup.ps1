# Script de configuración automática para San Rafael 360
# Copia los archivos de ejemplo a los reales con la URL correcta

$frontDotEnv = "frontend/.env.local"
$backDotEnv = "backend/.env"

Write-Host "Configurando entorno remoto para San Rafael 360..." -ForegroundColor Cyan

# Crear .env de Frontend
if (Test-Path "frontend/.env.example") {
    Copy-Item "frontend/.env.example" $frontDotEnv -Force
    Write-Host " [OK] Frontend: .env.local creado." -ForegroundColor Green
}

# Crear .env de Backend
if (Test-Path "backend/.env.example") {
    Copy-Item "backend/.env.example" $backDotEnv -Force
    Write-Host " [OK] Backend: .env creado." -ForegroundColor Green
}

Write-Host "`nConfiguración completada con éxito." -ForegroundColor Yellow
Write-Host "Ahora puedes abrir VS Code en tu notebook y empezar a trabajar."
Write-Host "Recuerda que no necesitas ejecutar npm install ni npm run dev localmente."
