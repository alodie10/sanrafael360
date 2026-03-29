// Script de diagnóstico — ejecutar con: node scripts/debug-csv.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../../importar_listeo_geocodificado.csv');

console.log('📂 Buscando CSV en:', CSV_PATH);
console.log('📁 Existe:', fs.existsSync(CSV_PATH));

const raw = fs.readFileSync(CSV_PATH, 'latin1');
console.log('📏 Tamaño del archivo:', raw.length, 'bytes');

const linesN = raw.split('\n');
const linesCRLF = raw.split('\r\n');

console.log('🔢 Líneas (split \\n):', linesN.length);
console.log('🔢 Líneas (split \\r\\n):', linesCRLF.length);
console.log('');
console.log('📋 Primera línea (raw):');
console.log(JSON.stringify(linesN[0].substring(0, 200)));
console.log('');
console.log('📋 Segunda línea (primera fila de datos):');
console.log(JSON.stringify(linesN[1]?.substring(0, 200)));
