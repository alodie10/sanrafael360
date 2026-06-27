const fs = require('fs');
const file = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `pagos: [
            pagoData,
            ...currentPagos
          ]`;

const replacement = `pagos: [
            { ...pagoData, id: 'temp_' + Date.now(), documentId: 'temp_' + Date.now(), createdAt: new Date().toISOString() },
            ...currentPagos
          ]`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
console.log("Fixed optimistic UI payload keys.");
