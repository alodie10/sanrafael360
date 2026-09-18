import { describe, expect, it } from 'vitest';
import { ForbiddenError, ValidationError } from '../../src/utils/errors';
import {
  assertFichaMinima,
  assertGuiaPuedePublicar,
  categoriaIdOf,
  negocioResumen,
  patchContactoTrasFicha,
} from '../../src/api/crm/crm-ficha';

describe('crm-ficha', () => {
  it('requires nombre, teléfono and categoría', () => {
    expect(() => assertFichaMinima({ nombre: 'Taller', telefono: '2615550000' })).toThrow(
      ValidationError
    );
    expect(() =>
      assertFichaMinima({ nombre: 'Taller', categoriaId: 'cat-1' })
    ).toThrow(ValidationError);
    expect(() =>
      assertFichaMinima({
        nombre: 'Taller',
        telefono: '2615550000',
        categoriaId: 'cat-1',
      })
    ).not.toThrow();
  });

  it('only SR360 admin can publish a listing', () => {
    expect(() =>
      assertGuiaPuedePublicar({ isAdmin: false, email: 'a@b.com' }, { modo: 'guia', slug: 'sr360' })
    ).toThrow(ForbiddenError);
    expect(() =>
      assertGuiaPuedePublicar({ isAdmin: true, email: 'a@b.com' }, { modo: 'agenda', slug: 'taller' })
    ).toThrow(ForbiddenError);
    expect(() =>
      assertGuiaPuedePublicar({ isAdmin: true, email: 'a@b.com' }, { modo: 'guia', slug: 'sr360' })
    ).not.toThrow();
  });

  it('links the listing without marking the contact as ganado', () => {
    expect(patchContactoTrasFicha('cat-1', 'neg-1')).toEqual({
      categoria: 'cat-1',
      negocio: 'neg-1',
    });
    expect(patchContactoTrasFicha('cat-1', 'neg-1')).not.toHaveProperty('estado');
  });

  it('reads categoria and negocio from populated rows', () => {
    expect(categoriaIdOf({ categoria: { documentId: 'cat-1' } })).toBe('cat-1');
    expect(
      negocioResumen({ negocio: { documentId: 'n1', slug: 'taller-x', nombre: 'Taller X' } })
    ).toEqual({ documentId: 'n1', slug: 'taller-x', nombre: 'Taller X' });
  });
});
