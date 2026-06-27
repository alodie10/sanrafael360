# 1. Fetch current business ID
DOC_ID="afga4e2wnl804a026ny7la0j"

# 2. Add payment
echo "Adding payment..."
curl -s -X POST http://localhost:1337/api/negocios/admin/pagos \
  -H "Content-Type: application/json" \
  -d "{\"monto\": 9999, \"estado\": \"aprobado\", \"fecha_pago\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"external_reference\": \"test-script\", \"negocio\": \"$DOC_ID\", \"extendMonths\": 1}" > /dev/null

# 3. GET business via REST API immediately
echo "Fetching business via REST API..."
curl -s "http://localhost:1337/api/negocios?filters\[documentId\]\[\$eq\]=$DOC_ID&populate\[pagos\]=true" | jq '.data[0].pagos'
