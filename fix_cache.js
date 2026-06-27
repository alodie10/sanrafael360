const fs = require('fs');
let viewPath = 'frontend/src/components/portal/AdminPaymentsView.tsx';
let viewCode = fs.readFileSync(viewPath, 'utf-8');

const oldFetch = `        const res = await fetch(\`\${strapiUrl}\${query}\`, {
          headers: { Authorization: \`Bearer \${jwt}\` }
        });`;

const newFetch = `        const res = await fetch(\`\${strapiUrl}\${query}\`, {
          headers: { Authorization: \`Bearer \${jwt}\` },
          cache: 'no-store'
        });`;

viewCode = viewCode.replace(oldFetch, newFetch);
fs.writeFileSync(viewPath, viewCode);
console.log("Cache disabled on fetch");
