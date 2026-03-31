
const fs = require('fs');
const path = require('path');

const CSV_PATH = 'c:/sanrafael360/scripts/legacy/importar_listeo_geocodificado.csv';

function analyze() {
  try {
    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n');
    
    // El header es la primera línea
    const titles = new Set();
    const duplicates = [];
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        const title = values[0].trim().toLowerCase();
        
        if (titles.has(title)) {
            duplicates.push(values[0].trim());
        } else {
            titles.add(title);
        }
        count++;
    }

    console.log('--- RESULTADOS DEL ANÁLISIS ---');
    console.log('Total registros detectados en CSV:', count);
    console.log('Negocios ÚNICOS (por título):', titles.size);
    console.log('Cantidad de duplicados:', duplicates.length);
    
    if (duplicates.length > 0) {
        console.log('\nPrimeros 5 duplicados como ejemplo:');
        console.log(duplicates.slice(0, 5).join(', '));
    }
  } catch (err) {
    console.error('Error al leer el archivo:', err);
  }
}

analyze();
