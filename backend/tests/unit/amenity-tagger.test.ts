import { describe, expect, it } from 'vitest';
import { applyLlmDecisions, proposalsToApply, tagNegocio } from '../../src/api/atributo/services/amenity-tagger';

const cabana = {
  id: 'cab-1',
  nombre: 'Cabañas del Valle',
  categoriaSlugs: ['cabanas'],
};

describe('tagNegocio', () => {
  it('marks alarm, medical cover, and white linen synonyms for lodging', () => {
    const proposals = tagNegocio({
      ...cabana,
      descripcion: 'Cuenta con alarma, servicio médico de guardia y juego de blanco.',
    });
    expect(proposals.find((item) => item.amenitySlug === 'alarma')?.confianza).toBe('alta');
    expect(proposals.find((item) => item.amenitySlug === 'servicio-de-emergencia-medica')?.confianza).toBe('alta');
    expect(proposals.find((item) => item.amenitySlug === 'ropa-blanca')?.confianza).toBe('alta');
  });

  it('marks pileta in the description as Piscina with high confidence', () => {
    const [hit] = tagNegocio({
      ...cabana,
      descripcion: 'Cabaña con pileta, parque cerrado y cochera cubierta para dos autos.',
    }).filter((item) => item.amenitySlug === 'piscina');
    expect(hit?.confianza).toBe('alta');
    expect(hit?.evidencia.startsWith('descripcion:')).toBe(true);
  });

  it('does not apply a negated cochera or pets', () => {
    const proposals = tagNegocio({
      ...cabana,
      descripcion: 'Alojamiento sin cochera. No se aceptan mascotas. Hay wifi.',
    });
    expect(proposals.find((item) => item.amenitySlug === 'cochera')?.confianza).toBe('negada');
    expect(proposals.find((item) => item.amenitySlug === 'pet-friendly')?.confianza).toBe('negada');
    expect(proposals.find((item) => item.amenitySlug === 'wifi')?.confianza).toBe('alta');
    expect(proposalsToApply(proposals).map((item) => item.amenitySlug)).toEqual(['wifi']);
  });

  it('keeps artisanal tableware out of the Vajilla amenity until a model confirms it', () => {
    const proposals = tagNegocio({
      id: 'shop-1',
      nombre: 'Cerámica Norte',
      categoriaSlugs: ['hogar_deco'],
      descripcion: 'Vendemos vajilla de cerámica artesanal hecha en el departamento.',
    });
    expect(proposals.find((item) => item.amenitySlug === 'vajilla')).toBeUndefined();
  });

  it('sends ambiguous vajilla in a lodging description to the model', () => {
    const hit = tagNegocio({
      ...cabana,
      descripcion: 'La cabaña incluye vajilla de cerámica artesanal para ocho personas y wifi.',
    }).find((item) => item.amenitySlug === 'vajilla');
    expect(hit?.confianza).toBe('dudosa');
    expect(hit?.llm).toBe(true);
    const [rejected] = applyLlmDecisions([hit!], { 'cab-1|vajilla': 'no' });
    expect(rejected.confianza).toBe('rechazada');
    expect(proposalsToApply([rejected])).toEqual([]);
  });

  it('treats a review-only wifi as doubtful and ignores the Google boilerplate', () => {
    const boilerplate = tagNegocio({
      ...cabana,
      descripcion: 'Negocio importado desde Google Maps. Ubicado en San Rafael, Mendoza, Argentina.',
      resenas: ['El wifi andaba perfecto.'],
    });
    expect(boilerplate.find((item) => item.amenitySlug === 'wifi')?.confianza).toBe('dudosa');
    expect(boilerplate.find((item) => item.amenitySlug === 'wifi')?.evidencia.startsWith('resenas:')).toBe(true);
  });

  it('routes cochera to Cochera for lodging and Estacionamiento for a restaurant', () => {
    const hotel = tagNegocio({ ...cabana, descripcion: 'Cuenta con cochera privada y desayuno.' });
    expect(hotel.find((item) => item.amenitySlug === 'cochera')?.amenity).toBe('Cochera');
    const resto = tagNegocio({
      id: 'resto-1',
      nombre: 'Lo de Juan',
      categoriaSlugs: ['restaurante'],
      descripcion: 'Hay cochera para los clientes y aceptamos tarjetas.',
    });
    expect(resto.find((item) => item.amenitySlug === 'estacionamiento')?.amenity).toBe('Estacionamiento');
    expect(resto.find((item) => item.amenitySlug === 'cochera')).toBeUndefined();
  });

  it('reads a denial that comes after the amenity word', () => {
    const proposals = tagNegocio({
      ...cabana,
      descripcion: 'Mascotas: no se admiten. El parque esta al lado del Parque Hipolito Yrigoyen.',
    });
    expect(proposals.find((item) => item.amenitySlug === 'pet-friendly')?.confianza).toBe('negada');
    expect(proposals.find((item) => item.amenitySlug === 'parque-jardin')).toBeUndefined();
  });

  it('does not propose an amenity that is already linked', () => {
    const proposals = tagNegocio({
      ...cabana,
      descripcion: 'Hay wifi y pileta.',
      amenitiesYaVinculados: ['wifi'],
    });
    expect(proposals.map((item) => item.amenitySlug)).toEqual(['piscina']);
  });
});
