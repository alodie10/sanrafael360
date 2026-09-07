import fs from 'fs';
import path from 'path';
import type { IgResult } from './lib/instagram-scrape';

const STRAPI_URL = (
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'https://sanrafael360-production.up.railway.app'
).replace(/\/$/, '');

const TOKEN = process.env.STRAPI_API_TOKEN || '';
const LIST_PATH = path.resolve(__dirname, '../../scratch/ig-scrape/update-ready.json');
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const INCLUDE_BACKFILL = args.has('--include-backfill');

function loadList(): IgResult[] {
  if (!fs.existsSync(LIST_PATH)) {
    throw new Error(`No está ${LIST_PATH}. Corré antes: npm run scrape:instagram`);
  }
  const ready = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8')) as IgResult[];
  if (!INCLUDE_BACKFILL) return ready;
  const backfillPath = path.resolve(__dirname, '../../scratch/ig-scrape/backfill-username.json');
  const backfill = JSON.parse(fs.readFileSync(backfillPath, 'utf8')) as IgResult[];
  return [...ready, ...backfill];
}

async function patchNegocio(row: IgResult) {
  const res = await fetch(`${STRAPI_URL}/api/negocios/${row.documentId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        instagram: row.instagramUrl,
        instagram_username: row.username,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${row.nombre}: ${res.status} ${text.slice(0, 200)}`);
  }
}

async function main() {
  const list = loadList().filter((r) => r.documentId && r.username && r.instagramUrl);
  console.log(`[ig-apply] ${list.length} fichas en la lista (${APPLY ? 'APPLY' : 'DRY-RUN'})`);
  if (!APPLY) {
    for (const row of list.slice(0, 15)) {
      console.log(`  ${row.nombre} → @${row.username} [${row.source}/${row.confidence}]`);
    }
    if (list.length > 15) console.log(`  … y ${list.length - 15} más`);
    console.log('[ig-apply] Nada se escribió. Para aplicar: STRAPI_API_TOKEN=... npm run apply:instagram -- --apply');
    return;
  }
  if (!TOKEN) throw new Error('Falta STRAPI_API_TOKEN');
  let ok = 0;
  for (const row of list) {
    await patchNegocio(row);
    ok += 1;
    if (ok % 25 === 0) console.log(`[ig-apply] ${ok}/${list.length}`);
  }
  console.log(`[ig-apply] Actualizados ${ok}/${list.length}`);
}

main().catch((err) => {
  console.error('[ig-apply] Fatal:', err);
  process.exit(1);
});
