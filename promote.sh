#!/bin/bash

# San Rafael 360 - Script de Promoción Profesional (Dev -> Prod)
# Autor: Antigravity (Lead DevOps)

# Colores para la terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando proceso de promoción a PRODUCCIÓN...${NC}"

# 1. Verificar que estemos en la rama develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${RED}❌ Error: Debes estar en la rama 'develop' para iniciar la promoción.${NC}"
    exit 1
fi

# 2. Verificar cambios pendientes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: Tienes cambios sin commitear. Limpia tu workspace antes de promocionar.${NC}"
    exit 1
fi

# 3. Pull preventivo
echo -e "${YELLOW}🔄 Sincronizando con el repositorio remoto...${NC}"
git pull origin develop

# 4. Gates de calidad (Sprint 0 — CI-02)
echo -e "${YELLOW}🧪 Ejecutando tests rápidos (unit + integration)...${NC}"
if ! npm run test:fast; then
    echo -e "${RED}❌ Error: test:fast falló. Corrige los tests antes de promocionar.${NC}"
    exit 1
fi

echo -e "${YELLOW}🏗️ Verificando build completo (backend + frontend)...${NC}"
if ! npm run build:all; then
    echo -e "${RED}❌ Error: build:all falló. Corrige el build antes de promocionar.${NC}"
    exit 1
fi

# 5. Confirmación final
read -p "¿Estás seguro de que quieres subir estos cambios a PRODUCCIÓN? (s/n): " confirm
if [[ $confirm != [sS] ]]; then
    echo -e "${RED}❌ Promoción cancelada por el usuario.${NC}"
    exit 1
fi

# 6. Proceso de Fusión (Merge)
echo -e "${YELLOW}🔀 Fusionando develop -> master...${NC}"
git checkout master
git merge develop

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Fusión exitosa. Subiendo a PRODUCCIÓN (Railway)...${NC}"
    git push origin master
    
    echo -e "${GREEN}✨ ¡Despliegue completado! La web de producción se está actualizando.${NC}"
else
    echo -e "${RED}❌ Error durante la fusión. Revisa los conflictos manualmente.${NC}"
    git checkout develop
    exit 1
fi

# 7. Volver a develop
echo -e "${YELLOW}↩️ Volviendo a la rama develop para continuar el desarrollo...${NC}"
git checkout develop
echo -e "${GREEN}👍 Listo. Workspace restaurado en develop.${NC}"
