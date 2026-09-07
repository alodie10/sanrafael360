import fs from 'fs';
import path from 'path';
import {
  candidatesFromFields,
  dedupeCandidates,
  flattenNegocio,
  mapPool,
  scoreHandle,
  scrapeWebsiteHandles,
  searchInstagramHandles,
  toResult,
  type IgCandidate,
  type IgResult,
  type NegocioRow,
} from './lib/instagram-scrape';

const STRAPI_URL = (
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'https://sanrafael360-production.up.railway.app'
).replace(/\/$/, '');

const OUT_DIR = path.resolve(__dirname, '../../scratch/ig-scrape');
const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 0;
const WITH_SEARCH = args.has('--search');
const CONCURRENCY = 4;

type StrapiList = { data?: Record<string, unknown>[]; meta?: { pagination?: { pageCount?: number } } };

async function fetchAllNegocios(): Promise<NegocioRow[]> {
  const rows: NegocioRow[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages) {
    const qs = new URLSearchParams({
      'fields[0]': 'nombre',
      'fields[1]': 'slug',
      'fields[2]': 'instagram',
      'fields[3]': 'website',
      'fields[4]': 'facebook',
      'populate[categoria][fields][0]': 'nombre',
      'pagination[page]': String(page),
      'pagination[pageSize]': '100',
    });
    const res = await fetch(`${STRAPI_URL}/api/negocios?${qs}`);
    if (!res.ok) throw new Error(`Strapi ${res.status} al listar negocios`);
    const json = (await res.json()) as StrapiList;
    pages = json.meta?.pagination?.pageCount || 1;
    for (const raw of json.data || []) {
      const row = flattenNegocio(raw);
      if (row) rows.push(row);
    }
    page += 1;
  }
  return rows;
}

function splitInventory(negocios: NegocioRow[]) {
  const resolved: IgResult[] = [];
  const toScrape: { row: NegocioRow; fieldCandidates: IgCandidate[] }[] = [];
  for (const row of negocios) {
    const fieldCandidates = candidatesFromFields(row);
    const fromExisting = fieldCandidates.filter((c) => c.source === 'existing');
    if (fromExisting.length) {
      resolved.push(toResult(row, fromExisting, ['ya_en_ficha']));
    } else if (fieldCandidates.length) {
      resolved.push(toResult(row, fieldCandidates, ['encontrado_en_otro_campo']));
    } else {
      toScrape.push({ row, fieldCandidates });
    }
  }
  return { resolved, toScrape };
}

function writeJson(name: string, data: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data, null, 2));
}

function writeCsv(name: string, rows: IgResult[]) {
  const header = 'nombre,categoria,username,instagramUrl,source,confidence,score,website';
  const lines = rows.map((r) =>
    [r.nombre, r.categoria || '', r.username || '', r.instagramUrl || '', r.source || '', r.confidence || '', r.score, r.website || '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  fs.writeFileSync(path.join(OUT_DIR, name), [header, ...lines].join('\n'));
}

function summarize(results: IgResult[]) {
  const existing = results.filter((r) => r.source === 'existing');
  const found = results.filter((r) => r.username && r.source !== 'existing');
  const high = found.filter((r) => r.confidence === 'high');
  const medium = found.filter((r) => r.confidence === 'medium');
  const low = found.filter((r) => r.confidence === 'low');
  const missing = results.filter((r) => !r.username);
  return { total: results.length, existing: existing.length, found: found.length, high: high.length, medium: medium.length, low: low.length, missing: missing.length };
}

function pushHandles(candidates: IgCandidate[], row: NegocioRow, handles: string[], source: IgCandidate['source']) {
  for (const username of handles) {
    candidates.push({ username, source, score: scoreHandle(row.nombre, username) });
  }
}

async function enrichMissing(row: NegocioRow, fieldCandidates: IgCandidate[]): Promise<IgResult> {
  const notes: string[] = [];
  const candidates = [...fieldCandidates];
  if (row.website) {
    const handles = await scrapeWebsiteHandles(row.website);
    if (!handles.length) notes.push('website_sin_ig');
    pushHandles(candidates, row, handles, 'website_html');
  } else {
    notes.push('sin_website');
  }
  if (WITH_SEARCH && !candidates.length) {
    const handles = await searchInstagramHandles(row.nombre);
    if (!handles.length) notes.push('search_sin_ig');
    pushHandles(candidates, row, handles, 'search');
  }
  return toResult(row, dedupeCandidates(candidates), notes);
}

async function main() {
  console.log(`[ig-scrape] Leyendo negocios de ${STRAPI_URL}`);
  const negocios = await fetchAllNegocios();
  const { resolved, toScrape } = splitInventory(negocios);
  const slice = LIMIT > 0 ? toScrape.slice(0, LIMIT) : toScrape;
  console.log(`[ig-scrape] ${negocios.length} comercios. Resueltos: ${resolved.length}. A scrapear: ${slice.length}${WITH_SEARCH ? ' (+search)' : ''}`);

  const scraped = await mapPool(slice, CONCURRENCY, async ({ row, fieldCandidates }, i) => {
    const result = await enrichMissing(row, fieldCandidates);
    if ((i + 1) % 20 === 0 || i === slice.length - 1) {
      console.log(`[ig-scrape] ${i + 1}/${slice.length} ${row.nombre} → ${result.username || '—'}`);
    }
    return result;
  });

  const skipped = LIMIT > 0 ? toScrape.slice(LIMIT).map((x) => toResult(x.row, [], ['pendiente_scrape'])) : [];
  const results = [...resolved, ...scraped, ...skipped];
  const stats = summarize(results);
  const updateReady = results.filter(
    (r) => r.username && (r.source !== 'existing' || r.notes.includes('encontrado_en_otro_campo')) && r.confidence !== 'low'
  );
  const backfill = results.filter((r) => r.source === 'existing' && r.username);
  const review = results.filter((r) => r.username && r.confidence === 'low');
  const missing = results.filter((r) => !r.username);

  writeJson('results.json', { generatedAt: new Date().toISOString(), strapiUrl: STRAPI_URL, stats, results });
  writeJson('update-ready.json', updateReady);
  writeJson('backfill-username.json', backfill);
  writeJson('needs-review.json', review);
  writeJson('missing.json', missing);
  writeJson('summary.json', stats);
  writeCsv('update-ready.csv', updateReady);
  writeCsv('needs-review.csv', review);

  console.log('[ig-scrape] Resumen', stats);
  console.log(`[ig-scrape] Listas en ${OUT_DIR}`);
  console.log('[ig-scrape] Update NO aplicado. Revisá el resumen y recién después: npm run apply:instagram');
}

main().catch((err) => {
  console.error('[ig-scrape] Fatal:', err);
  process.exit(1);
});
