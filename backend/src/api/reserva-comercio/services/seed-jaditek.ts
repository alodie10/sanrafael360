/** Defaults + seed del primer cliente (Jaditek). Idempotente por slug. */

export const JADITEK_SLUG = 'jaditek';

export const DEFAULT_HORARIO_LUN_SAB_16_22 = {
  dias: {
    '0': [] as { inicio: string; fin: string }[],
    '1': [{ inicio: '16:00', fin: '22:00' }],
    '2': [{ inicio: '16:00', fin: '22:00' }],
    '3': [{ inicio: '16:00', fin: '22:00' }],
    '4': [{ inicio: '16:00', fin: '22:00' }],
    '5': [{ inicio: '16:00', fin: '22:00' }],
    '6': [{ inicio: '16:00', fin: '22:00' }],
  },
};

/** 100% reembolso dentro de ventana; fuera = sin self-service. `reembolso_porcentaje: 0` = no reembolsar. */
export const DEFAULT_CANCELACION_POLITICA = {
  dentro_ventana: {
    reembolso_porcentaje: 100,
    cargo_fijo_ars: 0,
  },
  fuera_ventana: {
    permitir_self_service: false,
    reembolso_porcentaje: 0,
    cargo_fijo_ars: null as number | null,
  },
};

const JADITEK_RECURSOS = ['Puesto 1', 'Puesto 2', 'Puesto 3', 'Puesto 4'];

export async function seedJaditekReservaComercio(strapi: any): Promise<void> {
  const existing = await strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
    filters: { slug: { $eq: JADITEK_SLUG } },
    limit: 1,
  });

  if (!existing?.length) {
    const comercio = await strapi.documents('api::reserva-comercio.reserva-comercio').create({
      data: {
        nombre: 'Jaditek Sim Racing',
        slug: JADITEK_SLUG,
        nombre_publico: 'Jaditek Sim Racing',
        activo: true,
        timezone: 'America/Argentina/Mendoza',
        duracion_minutos: 60,
        buffer_limpieza_minutos: 0,
        anticipacion_llegada_minutos: 15,
        texto_llegada:
          'Llegá 15 minutos antes para la charla en el living y dejar todo listo para tu turno.',
        precio_ars: 15000,
        horario: DEFAULT_HORARIO_LUN_SAB_16_22,
        cancelacion_horas_minimas: 24,
        cancelacion_politica: DEFAULT_CANCELACION_POLITICA,
        hold_ttl_minutos: 15,
        mp_token_env: 'MP_ACCESS_TOKEN_JADITEK',
        modo_simulacion: true,
      },
    });

    for (let i = 0; i < JADITEK_RECURSOS.length; i++) {
      await strapi.documents('api::reserva-recurso.reserva-recurso').create({
        data: {
          nombre: JADITEK_RECURSOS[i],
          orden: i + 1,
          activo: true,
          comercio: comercio.documentId,
        },
      });
    }

    strapi.log.info(
      `[Reservas Seed] ✅ Jaditek creado (${comercio.documentId}) con ${JADITEK_RECURSOS.length} puestos.`
    );
  } else {
    strapi.log.info(`[Reservas Seed] Jaditek ya existe (${existing[0].documentId}). Omitido create.`);
  }

  const { ensureJaditekNegocioLink } = await import('./ensure-jaditek-negocio-link');
  await ensureJaditekNegocioLink(strapi);
}
