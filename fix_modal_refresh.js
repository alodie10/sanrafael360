const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', 'utf-8');

const targetPart = `        if (filterType === 'active') {
          query += \`&filters[is_premium][$eq]=true&filters[premium_valid_until][$gt]=\${new Date().toISOString()}\`;
        } else if (filterType === 'expired') {
          query += \`&filters[$or][0][is_premium][$eq]=false&filters[$or][1][premium_valid_until][$lt]=\${new Date().toISOString()}\`;
        }`;

const newPart = `        if (filterType === 'active') {
          query += \`&filters[$or][0][$and][0][is_premium][$eq]=true&filters[$or][0][$and][1][premium_valid_until][$gt]=\${new Date().toISOString()}\`;
        } else if (filterType === 'expired') {
          query += \`&filters[$or][0][$or][0][is_premium][$eq]=false&filters[$or][0][$or][1][premium_valid_until][$lt]=\${new Date().toISOString()}\`;
        }
        
        // Si hay un negocio seleccionado en el modal, ASEGURARNOS de que SIEMPRE venga en la respuesta
        // para que el modal se pueda refrescar incluso si el negocio cambió de estado (ej. de expirado a activo)
        if (selectedBusiness && filterType !== 'all') {
          query += \`&filters[$or][1][documentId][$eq]=\${selectedBusiness.documentId}\`;
        }`;

code = code.replace(targetPart, newPart);
fs.writeFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', code);
console.log("Fixed filter logic to always include selected business");
