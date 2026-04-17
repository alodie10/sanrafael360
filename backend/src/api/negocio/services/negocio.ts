import { factories } from '@strapi/strapi';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../utils/errors';

export default factories.createCoreService('api::negocio.negocio', ({ strapi }) => ({
  async claimNegocio(id: string, user: any, bodyData: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (negocio.owner && negocio.estado_reclamo !== 'ninguno') throw new ValidationError('El negocio ya tiene un reclamo activo');

    const updated = await repo.update(id, { estado_reclamo: 'pendiente', owner: user.id });
    if (files && (files.files || files.file)) await repo.uploadFile(updated.id, 'documentacion_reclamo', files.files || files.file);

    repo.sendEmail(
      'diegocristianalonso@gmail.com',
      `Nuevo reclamo: ${negocio.nombre}`,
      `<p>Usuario ${user.email} reclamó ${negocio.nombre}.</p>`
    ).catch(e => strapi.log.error('Email error:', e.message));
    return { id, status: 'pendiente' };
  },

  async getOwnerNegocios(userId: number) {
    const repo = createNegocioRepository(strapi);
    const res = await repo.findByOwner(userId, ['logo', 'categoria', 'imagen_portada', 'galeria']);
    return Array.from(new Map((res as any[]).map(i => [i.id, i])).values());
  },

  async updatePortal(id: string, userId: number, bodyData: any, files: any) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (Number(negocio.owner?.id) !== Number(userId)) throw new ForbiddenError();

    const allowed = ['descripcion', 'facebook', 'instagram', 'website', 'reserva_habilitada', 'galeria'];
    const updateData: any = {};
    allowed.forEach(f => { 
      if (bodyData[f] !== undefined) {
        // Strapi 5 expects an array of IDs for media relations to sync/keep
        updateData[f] = bodyData[f];
      }
    });

    const updated = await repo.update(id, updateData);
    if (files) {
      if (files.logo) await repo.uploadFile(updated.id, 'logo', files.logo);
      if (files.imagen_portada) await repo.uploadFile(updated.id, 'imagen_portada', files.imagen_portada);
      if (files.galeria) await repo.uploadFile(updated.id, 'galeria', files.galeria);
    }
    await repo.publish(id);
    return updated;
  },

  async resolveClaim(id: string, decision: string, motivo: string) {
    const repo = createNegocioRepository(strapi);
    const negocio = await repo.findById(id, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');

    const data = decision === 'approved' ? { estado_reclamo: 'aprobado' } : { estado_reclamo: 'ninguno', owner: null };
    await repo.update(id, data);
    await repo.publish(id);

    const subject = decision === 'approved' ? '¡Perfil Aprobado!' : 'Información sobre tu solicitud';
    repo.sendEmail(negocio.owner.email, subject, `<p>Tu trámite ha sido: ${decision}.</p>`);
    return { id, decision };
  }
}));
