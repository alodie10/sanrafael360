import crypto from 'crypto';
import { factories } from '@strapi/strapi';
import { NotFoundError, ValidationError } from '../../../utils/errors';

type StrapiUser = {
  id: number;
  documentId?: string;
  email: string;
  role?: { id: number };
};

async function findLeadByDocumentId(strapi: any, documentId: string) {
  const lead = await strapi.documents('api::lead.lead').findOne({ documentId });
  if (!lead) throw new NotFoundError('Lead');
  return lead;
}

async function findPropietarioRole(strapi: any) {
  return strapi.db.query('plugin::users-permissions.role').findOne({
    where: { name: 'Propietario' },
  });
}

async function findOrCreatePropietarioUser(strapi: any, email: string): Promise<StrapiUser> {
  const userEmail = email.toLowerCase().trim();
  const propietarioRole = await findPropietarioRole(strapi);

  let user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: userEmail },
  });

  if (!user) {
    return strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: userEmail,
        email: userEmail,
        password: crypto.randomBytes(20).toString('hex'),
        confirmed: true,
        role: propietarioRole?.id || 1,
        provider: 'local',
      },
    });
  }

  await strapi.db.query('plugin::users-permissions.user').update({
    where: { id: user.id },
    data: { role: propietarioRole?.id || user.role },
  });

  return user;
}

async function assignOwnerToNegocio(strapi: any, negocioDocumentId: string, user: StrapiUser) {
  const negocio = await strapi.documents('api::negocio.negocio').findOne({
    documentId: negocioDocumentId,
    populate: ['owner'],
  });

  if (!negocio) throw new NotFoundError('Negocio');
  if (negocio.owner) {
    throw new ValidationError(`El negocio "${negocio.nombre}" ya tiene un dueño asignado.`);
  }

  await strapi.documents('api::negocio.negocio').update({
    documentId: negocioDocumentId,
    data: {
      owner: user.documentId || user.id,
      reclamar_habilitado: true,
      verificado: true,
      estado_reclamo: 'aprobado',
    },
  });

  await strapi.documents('api::negocio.negocio').publish({ documentId: negocioDocumentId });

  return negocio;
}

async function markLeadConverted(strapi: any, leadDocumentId: string, negocioDocumentId: string) {
  await strapi.documents('api::lead.lead').update({
    documentId: leadDocumentId,
    data: {
      estado: 'convertido',
      negocio_vinculado: negocioDocumentId,
    },
  });
}

async function sendWelcomeAccessEmail(strapi: any, user: StrapiUser) {
  const resetPasswordToken = crypto.randomBytes(64).toString('hex');

  await strapi.db.query('plugin::users-permissions.user').update({
    where: { id: user.id },
    data: { resetPasswordToken },
  });

  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const emailSettings: any = await pluginStore.get({ key: 'email' });
  const advancedSettings: any = await pluginStore.get({ key: 'advanced' });

  let resetLink =
    advancedSettings?.email_reset_password || 'https://www.sanrafael360.com/restablecer-password';
  resetLink = resetLink.includes('?')
    ? `${resetLink}&code=${resetPasswordToken}`
    : `${resetLink}?code=${resetPasswordToken}`;

  await strapi.plugin('email').service('email').send({
    to: user.email,
    from: `San Rafael 360 <${process.env.RESEND_DEFAULT_FROM || 'no-reply@sanrafael360.com'}>`,
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
    const lead = await findLeadByDocumentId(strapi, leadDocumentId);
    const user = await findOrCreatePropietarioUser(strapi, lead.email);
    await assignOwnerToNegocio(strapi, negocioDocumentId, user);
    await markLeadConverted(strapi, leadDocumentId, negocioDocumentId);

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
