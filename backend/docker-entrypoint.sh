#!/bin/sh
# Valida variables de Railway antes de arrancar Strapi (diagnóstico claro en logs).
set -e

is_missing() {
  val="$1"
  [ -z "$val" ] || [ "$val" = "build-placeholder" ]
}

# Normaliza alias de Vercel → nombres que espera el backend Strapi
if is_missing "$CLOUDINARY_NAME" && [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
  export CLOUDINARY_NAME="$CLOUDINARY_CLOUD_NAME"
fi
if is_missing "$CLOUDINARY_KEY" && [ -n "$CLOUDINARY_API_KEY" ]; then
  export CLOUDINARY_KEY="$CLOUDINARY_API_KEY"
fi
if is_missing "$CLOUDINARY_SECRET" && [ -n "$CLOUDINARY_API_SECRET" ]; then
  export CLOUDINARY_SECRET="$CLOUDINARY_API_SECRET"
fi

MISSING=""
for key in \
  ADMIN_JWT_SECRET API_TOKEN_SALT TRANSFER_TOKEN_SALT ENCRYPTION_KEY APP_KEYS JWT_SECRET \
  CLOUDINARY_NAME CLOUDINARY_KEY CLOUDINARY_SECRET RESEND_API_KEY
do
  eval "val=\$$key"
  if is_missing "$val"; then
    MISSING="$MISSING $key"
  fi
done

if [ -n "$MISSING" ]; then
  echo "============================================================"
  echo "[San Rafael 360] Faltan variables en RUNTIME (Railway):$MISSING"
  echo ""
  echo "Backend Strapi espera: CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET"
  echo "También acepta alias:  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
  echo ""
  echo "Ve a: Railway → servicio BACKEND (Docker) → pestaña Variables"
  echo "Asegurate de que estén en ESTE servicio, no solo en Vercel u otro."
  echo "Luego: Redeploy"
  echo "============================================================"
  exit 1
fi

echo "[San Rafael 360] Variables de entorno OK (CLOUDINARY_NAME=${CLOUDINARY_NAME}). Iniciando Strapi..."
exec npm start
