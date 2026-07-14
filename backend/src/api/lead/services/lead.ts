import crypto from 'crypto';
import { factories } from '@strapi/strapi';
import { createLeadRepository } from '../repositories/lead-repository';
import { createNegocioRepository } from '../../negocio/repositories/negocio-repository';
import { createUserRepository } from '../../../repositories/user-repository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { resolveResendFromAddress } from '../../../services/notification-service';

type StrapiUser = {
  id: number;
  documentId?: string;
  email: string;
  role?: { id: number };
};

async function sendWelcomeAccessEmail(strapi: any, user: StrapiUser) {
  const resetPasswordToken = crypto.randomBytes(64).toString('hex');
  const userRepo = createUserRepository(strapi);

  await userRepo.setResetPasswordToken(user.id, resetPasswordToken);

  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advancedSettings: any = await pluginStore.get({ key: 'advanced' });

  let resetLink =
    advancedSettings?.email_reset_password || 'https://www.sanrafael360.com/restablecer-password';
  resetLink = resetLink.includes('?')
    ? `${resetLink}&code=${resetPasswordToken}`
    : `${resetLink}?code=${resetPasswordToken}`;

  await strapi.plugin('email').service('email').send({
    to: user.email,
    from: resolveResendFromAddress(),
    subject: 'Configuración de acceso - San Rafael 360',
    html: `
      <div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #111;">¡Gracias por ser parte de San Rafael 360!</h2>
        <p>Para gestionar tu negocio, por favor define tu contraseña en el siguiente enlace:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}"
             style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Configurar mi Contraseña</a>
        </div>
        <p style="color: #666; font-size: 12px;">Si no has solicitado este acceso, puedes ignorar este mensaje.</p>
      </div>
    `,
  });

  strapi.log.info(`📧 Email de bienvenida enviado a: ${user.email}`);
}

export default factories.createCoreService('api::lead.lead', ({ strapi }) => ({
  async convertLead(leadDocumentId: string, negocioDocumentId: string) {
    const leadRepo = createLeadRepository(strapi);
    const negocioRepo = createNegocioRepository(strapi);
    const userRepo = createUserRepository(strapi);

    const lead = await leadRepo.findByDocumentId(leadDocumentId);
    if (!lead) throw new NotFoundError('Lead');

    const propietarioRole = await userRepo.findPropietarioRole();
    const roleId = propietarioRole?.id || 1;

    let user = await userRepo.findByEmail(lead.email);
    if (!user) {
      user = await userRepo.createPropietarioUser(lead.email, roleId);
    } else {
      await userRepo.updateRole(user.id, roleId);
      user = { ...user, role: { id: roleId } };
    }

    const negocio = await negocioRepo.findById(negocioDocumentId, ['owner']);
    if (!negocio) throw new NotFoundError('Negocio');
    if (negocio.owner) {
      throw new ValidationError(`El negocio "${negocio.nombre}" ya tiene un dueño asignado.`);
    }

    await negocioRepo.update(negocioDocumentId, {
      owner: user.documentId || user.id,
      reclamar_habilitado: true,
      verificado: true,
      estado_reclamo: 'aprobado',
    });
    await negocioRepo.publish(negocioDocumentId);
    await leadRepo.markConverted(leadDocumentId, negocioDocumentId);

    try {
      await sendWelcomeAccessEmail(strapi, user);
    } catch (emailErr: any) {
      strapi.log.error(`❌ Error enviando email de bienvenida: ${emailErr.message}`);
    }

    return {
      success: true,
      message: 'Lead convertido y email de bienvenida enviado',
      userId: user.id,
    };
  },
}));
