import { describe, expect, it } from 'vitest';
import { mapLegacyReviews } from '../../src/services/google-reviews-sync';

describe('mapLegacyReviews', () => {
  it('filtra rating < 4 y ordena desc', () => {
    const mapped = mapLegacyReviews([
      { author_name: 'A', rating: 3, text: 'meh', relative_time_description: '1w' },
      { author_name: 'B', rating: 5, text: 'genial', relative_time_description: '2d' },
      { author_name: 'C', rating: 4, text: 'ok', relative_time_description: '1m' },
    ]);

    expect(mapped).toHaveLength(2);
    expect(mapped[0].author_name).toBe('B');
    expect(mapped[1].author_name).toBe('C');
  });

  it('devuelve [] si input inválido', () => {
    expect(mapLegacyReviews(undefined)).toEqual([]);
  });
});
