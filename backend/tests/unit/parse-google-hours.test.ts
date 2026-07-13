import { describe, it, expect } from 'vitest';
import { parseGoogleHours } from '../../src/utils/parse-google-hours';

describe('parseGoogleHours', () => {
  it('parses 24h colon-separated format', () => {
    const result = parseGoogleHours('lunes: 12:00–23:00; martes: 12:00–23:00');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      day: 'Lunes',
      is_closed: false,
      opening_time: '12:00:00.000',
      closing_time: '23:00:00.000',
    });
  });

  it('marks closed days', () => {
    const result = parseGoogleHours('domingo: cerrado');
    expect(result[0]).toMatchObject({ day: 'Domingo', is_closed: true });
  });

  it('returns empty array for empty input', () => {
    expect(parseGoogleHours('')).toEqual([]);
  });
});
