/**
 * Etiquetado de amenities. Por defecto no escribe.
 *   npx tsx scripts/tag-amenities.ts
 *   npx tsx scripts/tag-amenities.ts --llm-decisions tmp/amenity-tags/llm-decisions.json
 *   npx tsx scripts/tag-amenities.ts --apply
 *   npx tsx scripts/tag-amenities.ts --apply-approved tmp/amenity-tags/dudosas.csv
 */
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import {
  applyLlmDecisions,
  proposalsToApply,
  tagNegocio,
  type TagProposal,
} from '../src/api/atributo/services/amenity-tagger';

const OUT = path.resolve(process.cwd(), '../tmp/amenity-tags');

type Row = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_slugs: string[] | null;
  tag_slugs: string[] | null;
  resenas: string[] | null;
  google_reviews: Array<{ text?: string }> | null;
  ya: string[] | null;
};

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(proposals: TagProposal[]): string {
  const header = ['negocio_id', 'nombre', 'rubro', 'amenity', 'confianza', 'evidencia'];
  const lines = proposals.map((proposal) =>
    [proposal.negocioId, proposal.nombre, proposal.rubro, proposal.amenity, proposal.confianza, proposal.evidencia]
      .map(csvCell)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}

function reviewTexts(row: Row): string[] {
  const texts = [...(row.resenas || [])];
  for (const review of row.google_reviews || []) {
    if (review?.text) texts.push(review.text);
  }
  return texts;
}

function parseApproved(csv: string): Array<{ negocioId: string; amenity: string }> {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(',') || [];
  const idAt = header.indexOf('negocio_id');
  const amenityAt = header.indexOf('amenity');
  if (idAt < 0 || amenityAt < 0) throw new Error('El CSV aprobado necesita negocio_id y amenity');
  return lines.map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
    const clean = (value: string) => value.replace(/^"|"$/g, '').replace(/""/g, '"');
    return { negocioId: clean(cells[idAt] || ''), amenity: clean(cells[amenityAt] || '') };
  });
}

async function loadRows(client: Client): Promise<Row[]> {
  const result = await client.query<Row>(`
    SELECT n.document_id AS id,
           n.nombre,
           n.descripcion,
           cats.slugs AS categoria_slugs,
           tags.slugs AS tag_slugs,
           rv.comentarios AS resenas,
           n.google_reviews,
           fac.slugs AS ya
    FROM negocios n
    LEFT JOIN LATERAL (
      SELECT array_agg(DISTINCT c.slug) AS slugs
      FROM negocios_categoria_lnk cl
      JOIN categorias c ON c.id = cl.categoria_id AND c.published_at IS NOT NULL
      WHERE cl.negocio_id = n.id
    ) cats ON true
    LEFT JOIN LATERAL (
      SELECT array_agg(DISTINCT a.slug) AS slugs
      FROM negocios_atributos_lnk l
      JOIN atributos a ON a.id = l.atributo_id AND a.published_at IS NOT NULL AND a.tipo = 'tag'
      WHERE l.negocio_id = n.id
    ) tags ON true
    LEFT JOIN LATERAL (
      SELECT array_agg(r.comentario) FILTER (WHERE r.comentario IS NOT NULL) AS comentarios
      FROM reviews_negocio_lnk rl
      JOIN reviews r ON r.id = rl.review_id
      WHERE rl.negocio_id = n.id
    ) rv ON true
    LEFT JOIN LATERAL (
      SELECT array_agg(DISTINCT a.slug) AS slugs
      FROM negocios_atributos_lnk l
      JOIN atributos a ON a.id = l.atributo_id AND a.published_at IS NOT NULL AND a.tipo = 'facilidad'
      WHERE l.negocio_id = n.id
    ) fac ON true
    WHERE n.published_at IS NOT NULL
    ORDER BY n.nombre
  `);
  return result.rows;
}

function buildProposals(rows: Row[], decisions: Record<string, 'si' | 'no'>): TagProposal[] {
  const proposals = rows.flatMap((row) =>
    tagNegocio({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoriaSlugs: row.categoria_slugs || [],
      tagSlugs: row.tag_slugs || [],
      resenas: reviewTexts(row),
      amenitiesYaVinculados: row.ya || [],
    })
  );
  return applyLlmDecisions(proposals, decisions);
}

async function applyLinks(client: Client, pairs: Array<{ negocioId: string; amenity: string }>) {
  let inserted = 0;
  for (const pair of pairs) {
    const result = await client.query(
      `
      WITH negocio AS (
        SELECT id, published_at IS NOT NULL AS published FROM negocios WHERE document_id = $1
      ),
      amenity AS (
        SELECT id, published_at IS NOT NULL AS published FROM atributos WHERE slug = $2 AND tipo = 'facilidad'
      ),
      missing AS (
        SELECT n.id AS negocio_id, a.id AS atributo_id
        FROM negocio n
        JOIN amenity a ON a.published = n.published
        WHERE NOT EXISTS (
          SELECT 1 FROM negocios_atributos_lnk l
          WHERE l.negocio_id = n.id AND l.atributo_id = a.id
        )
      ),
      ranked AS (
        SELECT m.negocio_id,
               m.atributo_id,
               COALESCE((SELECT max(atributo_ord) FROM negocios_atributos_lnk WHERE negocio_id = m.negocio_id), 0) + 1 AS atributo_ord,
               COALESCE((SELECT max(negocio_ord) FROM negocios_atributos_lnk WHERE atributo_id = m.atributo_id), 0) + 1 AS negocio_ord
        FROM missing m
      )
      INSERT INTO negocios_atributos_lnk (negocio_id, atributo_id, atributo_ord, negocio_ord)
      SELECT negocio_id, atributo_id, atributo_ord, negocio_ord FROM ranked
      `,
      [pair.negocioId, pair.amenity]
    );
    inserted += result.rowCount || 0;
  }
  return inserted;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const approvedPath = argValue('--apply-approved');
  if (apply && approvedPath) throw new Error('Usá --apply o --apply-approved, no los dos');
  const decisionsPath = argValue('--llm-decisions');
  const decisions: Record<string, 'si' | 'no'> = decisionsPath
    ? JSON.parse(fs.readFileSync(path.resolve(decisionsPath), 'utf8'))
    : {};

  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: process.env.DATABASE_PUBLIC_URL ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    if (approvedPath) {
      const approved = parseApproved(fs.readFileSync(path.resolve(approvedPath), 'utf8'));
      if (!process.argv.includes('--apply-approved')) return;
      await client.query('BEGIN');
      const inserted = await applyLinks(
        client,
        approved.map((row) => ({ negocioId: row.negocioId, amenity: slugFromName(row.amenity) }))
      );
      await client.query('COMMIT');
      console.log(JSON.stringify({ appliedApproved: inserted, rows: approved.length }));
      return;
    }

    const rows = await loadRows(client);
    const proposals = buildProposals(rows, decisions);
    const alta = proposalsToApply(proposals);
    const dudosas = proposals.filter((item) => item.confianza === 'dudosa');
    const llmPending = dudosas.filter((item) => item.llm && !item.evidencia.startsWith('llm:'));
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'review.csv'), toCsv(proposals));
    fs.writeFileSync(path.join(OUT, 'alta.csv'), toCsv(alta));
    fs.writeFileSync(path.join(OUT, 'dudosas.csv'), toCsv(dudosas));
    fs.writeFileSync(
      path.join(OUT, 'ambiguos.json'),
      JSON.stringify(
        llmPending.map((item) => ({
          key: `${item.negocioId}|${item.amenitySlug}`,
          nombre: item.nombre,
          amenity: item.amenity,
          evidencia: item.evidencia,
        })),
        null,
        2
      )
    );
    const summary = {
      negocios: rows.length,
      propuestas: proposals.length,
      alta: alta.length,
      dudosas: dudosas.length,
      negadas: proposals.filter((item) => item.confianza === 'negada').length,
      rechazadas: proposals.filter((item) => item.confianza === 'rechazada').length,
      ambiguosSinModelo: llmPending.length,
      modo: apply ? 'apply' : 'dry-run',
    };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));

    if (!apply) return;
    await client.query('BEGIN');
    const inserted = await applyLinks(
      client,
      alta.map((item) => ({ negocioId: item.negocioId, amenity: item.amenitySlug }))
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ inserted }));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

function slugFromName(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
