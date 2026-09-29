import { describe, expect, it } from 'vitest';
import {
  filterAlcanzadosUi,
  opcionesCampana,
  ultimoEnvioReciente,
  type CrmAlcanzado,
} from '../../../frontend/src/lib/crm';

const DIA = 24 * 60 * 60 * 1000;

function row(partial: Partial<CrmAlcanzado> & Pick<CrmAlcanzado, 'documentId' | 'enviadoAt'>): CrmAlcanzado {
  return {
    nombre: 'Taller',
    telefono: '',
    nota: '',
    estado: 'contactado',
    origen: 'manual',
    categoriaNombre: '',
    negocioSlug: '',
    contactoDocumentId: partial.documentId,
    envios: [{ campana: 'SR360', enviadoAt: partial.enviadoAt, plantillaIndex: 0 }],
    ...partial,
  };
}

describe('aviso de contacto reciente', () => {
  const now = new Date('2026-09-29T15:00:00.000Z').getTime();

  it('warns when the latest WhatsApp is under 30 days', () => {
    const reciente = row({
      documentId: 'c1',
      enviadoAt: new Date(now - 10 * DIA).toISOString(),
    });
    expect(ultimoEnvioReciente(reciente, now)?.campana).toBe('SR360');
  });

  it('stays quiet when the latest WhatsApp is 30 days old or more', () => {
    const viejo = row({
      documentId: 'c1',
      enviadoAt: new Date(now - 30 * DIA).toISOString(),
      envios: [
        { campana: 'Seguimiento', enviadoAt: new Date(now - 40 * DIA).toISOString(), plantillaIndex: 2 },
        { campana: 'SR360', enviadoAt: new Date(now - 30 * DIA).toISOString(), plantillaIndex: 0 },
      ],
    });
    expect(ultimoEnvioReciente(viejo, now)).toBeNull();
  });

  it('filters by the date of the chosen campaign and lists its title', () => {
    const contacto = row({
      documentId: 'c1',
      enviadoAt: '2026-09-18T12:00:00.000Z',
      envios: [
        { campana: 'SR360', enviadoAt: '2026-09-18T12:00:00.000Z', plantillaIndex: 0 },
        { campana: 'Seguimiento', enviadoAt: '2026-09-01T12:00:00.000Z', plantillaIndex: 2 },
      ],
    });
    const filtro = { estado: '' as const, desde: '2026-09-01', hasta: '2026-09-01', campana: 'Seguimiento' };
    expect(filterAlcanzadosUi([contacto], filtro)).toHaveLength(1);
    expect(filterAlcanzadosUi([contacto], { ...filtro, campana: '' })).toHaveLength(0);
    expect(opcionesCampana([{ titulo: 'SR360' }, { titulo: 'Oferta' }], [contacto])).toEqual([
      'SR360',
      'Oferta',
      'Seguimiento',
    ]);
  });
});