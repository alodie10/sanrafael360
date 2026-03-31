import fs from 'fs';
const data = JSON.parse(fs.readFileSync('c:/sanrafael360/backend/scripts/csv_mapping.json', 'utf-8').replace(/^\uFEFF/, ''));
const uniqueTitles = new Set(data.map(e => e.post_title));
console.log('Total entries:', data.length);
console.log('Unique businesses in mapping:', uniqueTitles.size);
