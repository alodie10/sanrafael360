const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', 'utf-8');

const targetPart = `        const json = await res.json();
        console.log(\`DEBUG: Strapi devolvió \${json.data?.length || 0} negocios de un total de \${json.meta?.pagination?.total || 0}\`);
        setData(json.data || []);`;

const newPart = `        const json = await res.json();
        console.log(\`DEBUG: Strapi devolvió \${json.data?.length || 0} negocios\`);
        if (selectedBusiness) {
          const check = json.data.find(b => b.id === selectedBusiness.id);
          console.log("DEBUG: Refresh fetched selected business pagos:", check?.pagos?.length || (check?.pagos?.data?.length || 0));
        }
        setData(json.data || []);`;

code = code.replace(targetPart, newPart);
fs.writeFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', code);
console.log("Added debug logs for refresh");
