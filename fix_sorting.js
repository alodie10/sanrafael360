const fs = require('fs');
let pagePath = 'frontend/src/app/page.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf-8');

const brokenCode = `        setAlgoliaHits(results[0]?.hits || []);`;
const fixedCode = `        // Aseguramos que los Premium aparezcan primero en los resultados locales
        const hits = results[0]?.hits || [];
        const sortedHits = hits.sort((a, b) => {
          if (a.is_premium && !b.is_premium) return -1;
          if (!a.is_premium && b.is_premium) return 1;
          return 0;
        });
        setAlgoliaHits(sortedHits);`;

pageCode = pageCode.replace(brokenCode, fixedCode);
fs.writeFileSync(pagePath, pageCode);
console.log("Sorting fixed!");
