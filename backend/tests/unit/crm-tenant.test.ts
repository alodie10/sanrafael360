import { describe, expect, it } from 'vitest';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/utils/errors';
import {
  assertContactoInTenant,
  assertPrestamoSlug,
  assertValidOwnerEmail,
  createPrestamo,
  loadTenant,
  modoOf,
  slugFromNombre,
} from '../../src/api/crm/crm-tenant';
import { CRM_TENANT_SLUG } from '../../src/api/crm/crm-defaults';

function fakeRepo(seed: any[] = []) {
  const comercios = [...seed];
  const plantillas: any[] = [];
  return {
    findComercioBySlug: async (slug: string) => comercios.find((c) => c.slug === slug) || null,
    findComercioByOwnerEmail: async (email: string) =>
      comercios.find((c) => c.owner_email === email) || null,
    listComercios: async () => comercios,
    createComercio: async (data: any) => {
      const row = { documentId: `c${comercios.length + 1}`, ...data };
      comercios.push(row);
      return row;
    },
    findPlantillaByComercio: async (id: string) =>
      plantillas.find((p) => p.comercio === id) || null,
    createPlantilla: async (data: any) => {
      plantillas.push(data);
      return data;
    },
  } as any;
}

describe('crm-tenant', () => {
  it('slugifies a commerce name', () => {
    expect(slugFromNombre('Taller El Sol')).toBe('taller-el-sol');
  });

  it('rejects lending the sr360 slug', () => {
    expect(() => assertPrestamoSlug(CRM_TENANT_SLUG)).toThrow(ValidationError);
  });

  it('normalizes and validates owner email', () => {
    expect(assertValidOwnerEmail('  Ana@Taller.com ')).toBe('ana@taller.com');
    expect(() => assertValidOwnerEmail('nope')).toThrow(ValidationError);
  });

  it('treats missing modo as guia only for sr360', () => {
    expect(modoOf({ slug: 'sr360' })).toBe('guia');
    expect(modoOf({ slug: 'taller-x' })).toBe('agenda');
  });

  it('hides a contacto from another tenant', () => {
    expect(() =>
      assertContactoInTenant({ comercio: { documentId: 'other' } }, 'mine')
    ).toThrow(NotFoundError);
  });

  it('creates an agenda tenant with its own cupo and without the guide quarry', async () => {
    const repo = fakeRepo();
    const tenant = await createPrestamo(repo, {
      nombre: 'Taller El Sol',
      owner_email: 'ana@taller.com',
    });
    expect(tenant.modo).toBe('agenda');
    expect(tenant.slug).toBe('taller-el-sol');
    expect(tenant.owner_email).toBe('ana@taller.com');
  });

  it('does not let a third party open sr360 or another loan', async () => {
    const repo = fakeRepo([
      {
        documentId: 'c1',
        slug: 'taller-el-sol',
        nombre: 'Taller',
        modo: 'agenda',
        owner_email: 'ana@taller.com',
        activo: true,
      },
    ]);
    await expect(
      loadTenant(repo, { isAdmin: false, email: 'otro@mail.com' })
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      loadTenant(repo, { isAdmin: false, email: 'ana@taller.com' }, 'sr360')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects a second loan to the same email', async () => {
    const repo = fakeRepo();
    await createPrestamo(repo, { nombre: 'Uno', owner_email: 'ana@taller.com', slug: 'uno' });
    await expect(
      createPrestamo(repo, { nombre: 'Dos', owner_email: 'ana@taller.com', slug: 'dos' })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
