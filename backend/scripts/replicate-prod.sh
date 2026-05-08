#!/bin/bash

# Script de Replicación de Datos Prod -> Local para San Rafael 360
# Uso: ./scripts/replicate-prod.sh [PROD_TRANSFER_TOKEN]

TOKEN=$1
PROD_URL="https://sanrafael360-production.up.railway.app"

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Debes proporcionar el Transfer Token de Producción."
    echo "Uso: ./scripts/replicate-prod.sh TU_TOKEN_AQUI"
    exit 1
fi

echo "🚀 Iniciando replicación desde $PROD_URL..."
echo "⚠️  ADVERTENCIA: Esto SOBRESCRIBIRÁ tu base de datos local actual."
read -p "¿Estás seguro? (s/n): " confirm

if [[ $confirm == [sS] ]]; then
    echo "🧹 Limpiando caché local..."
    rm -rf .cache dist
    
    echo "📥 Transfiriendo datos (esto puede demorar unos minutos)..."
    # En Strapi 5, si no se especifica --to, intenta aplicar a la instancia local actual si se ejecuta desde la raíz
    npx strapi transfer --from "$PROD_URL/admin" --from-token "$TOKEN" --force
    
    echo "✨ Replicación completada con éxito."
    echo "🔄 Reinicia tu servidor local con 'npm run develop' para ver los cambios."
else
    echo "❌ Operación cancelada."
fi
