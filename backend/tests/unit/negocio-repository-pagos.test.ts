import { describe, expect, it, vi } from 'vitest';
import { NegocioRepository } from '../../src/api/negocio/repositories/negocio-repository';

function pageOf(start: number, total: number, pageSize = 200) {
  return Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, index) => ({
    documentId: `doc-${start + index}`,
    nombre: start + index === total - 1 ? 'Jaditek Sim Racing' : `Negocio ${start + index}`,
  }));
}

describe('NegocioRepository.findPublishedWithPagos', () => {
  it('reads every published negocio past the old 1000 cap', async () => {
    const total = 1092;
    const findMany = vi.fn(async ({ start, limit }: { start: number; limit: number }) =>
      pageOf(start, total, limit)
    );
    const repo = new NegocioRepository({
      documents: () => ({ findMany }),
    });

    const rows = await repo.findPublishedWithPagos();

    expect(rows).toHaveLength(total);
    expect(rows[rows.length - 1].nombre).toBe('Jaditek Sim Racing');
    expect(findMany).toHaveBeenCalledTimes(6);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      status: 'published',
      start: 0,
      limit: 200,
      sort: ['id:asc'],
    });
  });

  it('stops if a later page repeats the first rows', async () => {
    const firstPage = pageOf(0, 200);
    const findMany = vi.fn(async () => firstPage);
    const repo = new NegocioRepository({
      documents: () => ({ findMany }),
    });

    const rows = await repo.findPublishedWithPagos();

    expect(rows).toHaveLength(200);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
