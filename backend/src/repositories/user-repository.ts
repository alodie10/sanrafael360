import crypto from 'crypto';

type StrapiUser = {
  id: number;
  documentId?: string;
  email: string;
  role?: { id: number; name?: string };
};

export class UserRepository {
  constructor(private readonly strapi: any) {}

  async findById(userId: number, populate: string[] = []) {
    return this.strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate,
    });
  }

  async findByEmail(email: string) {
    return this.strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findPropietarioRole() {
    return this.strapi.db.query('plugin::users-permissions.role').findOne({
      where: { name: 'Propietario' },
    });
  }

  async createPropietarioUser(email: string, roleId: number): Promise<StrapiUser> {
    const userEmail = email.toLowerCase().trim();
    return this.strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: userEmail,
        email: userEmail,
        password: crypto.randomBytes(20).toString('hex'),
        confirmed: true,
        role: roleId,
        provider: 'local',
      },
    });
  }

  async updateRole(userId: number, roleId: number) {
    return this.strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { role: roleId },
    });
  }

  async setResetPasswordToken(userId: number, token: string) {
    return this.strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { resetPasswordToken: token },
    });
  }
}

export const createUserRepository = (strapi: any) => new UserRepository(strapi);
