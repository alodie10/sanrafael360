const fs = require('fs');
const file = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Reset extendMonths
code = code.replace(
  'setAmount("");\n      setNotes("");\n      setRefreshTrigger',
  'setAmount("");\n      setNotes("");\n      setExtendMonths(1);\n      setRefreshTrigger'
);

// 2. Optimistic update
code = code.replace(
  'setRefreshTrigger(prev => prev + 1);',
  `setRefreshTrigger(prev => prev + 1);
      
      // Optimistic update para que se vea inmediato en pantalla
      setSelectedBusiness(prev => {
        if (!prev) return prev;
        const currentPagos = Array.isArray(prev.pagos) ? [...prev.pagos] : [...(prev.pagos?.data || [])];
        return {
          ...prev,
          pagos: [
            pagoData,
            ...currentPagos
          ]
        };
      });`
);

fs.writeFileSync(file, code);
console.log("Patched AdminPaymentsView for optimistic UI and select reset.");
