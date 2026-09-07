import { factories } from '@strapi/strapi';
import { createGuideSettingRepository } from '../repositories/guide-setting-repository';

const DEFAULTS = {
  paused: false,
  copy_intro: 'Soy Rafi, tu guía en San Rafael 360. Preguntame qué necesitás…',
  copy_no_results: 'No encontré fichas para eso. Probá con otra zona o rubro, o usá la búsqueda de arriba.',
  copy_cta_anunciar: 'Si querés destacar tu negocio en SR360, escribinos acá.',
  copy_cta_anunciar_url: '/contacto',
};

function toPublic(row: any) {
  return {
    paused: Boolean(row?.paused),
    copy_intro: row?.copy_intro || DEFAULTS.copy_intro,
    copy_no_results: row?.copy_no_results || DEFAULTS.copy_no_results,
    copy_cta_anunciar: row?.copy_cta_anunciar || DEFAULTS.copy_cta_anunciar,
    copy_cta_anunciar_url: row?.copy_cta_anunciar_url || DEFAULTS.copy_cta_anunciar_url,
    llm_model: 'gpt-4o-mini',
    algolia_index: process.env.ALGOLIA_INDEX_NAME || 'negocios',
  };
}

export default factories.createCoreService('api::guide-setting.guide-setting' as any, ({ strapi }) => ({
  repo() {
    return createGuideSettingRepository(strapi);
  },

  async getSettings() {
    const row = await this.repo().find();
    return toPublic(row);
  },

  async updateSettings(body: Record<string, unknown>) {
    const data: Record<string, unknown> = {};
    if (typeof body.paused === 'boolean') data.paused = body.paused;
    if (typeof body.copy_intro === 'string') data.copy_intro = body.copy_intro;
    if (typeof body.copy_no_results === 'string') data.copy_no_results = body.copy_no_results;
    if (typeof body.copy_cta_anunciar === 'string') data.copy_cta_anunciar = body.copy_cta_anunciar;
    if (typeof body.copy_cta_anunciar_url === 'string') data.copy_cta_anunciar_url = body.copy_cta_anunciar_url;
    const row = await this.repo().upsert(data);
    return toPublic(row);
  },
}));
