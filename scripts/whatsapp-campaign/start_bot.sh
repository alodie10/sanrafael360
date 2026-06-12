#!/bin/bash

echo "🚀 Iniciando Guardián Automático de Campaña..."
echo "=================================================="
echo "Este script mantendrá vivo al bot. Si WhatsApp se"
echo "desconecta, lo revivirá automáticamente tras 15s."
echo "=================================================="

while true; do
  node bot.js
  
  # Si el bot sale con código 0 (éxito total)
  if [ $? -eq 0 ]; then
    echo "🎉 ¡Campaña terminada al 100%! Apagando Guardián."
    break
  fi
  
  echo "⚠️ El bot se cerró inesperadamente."
  echo "⏳ Esperando 15 segundos antes de intentar reconectar..."
  sleep 15
done
