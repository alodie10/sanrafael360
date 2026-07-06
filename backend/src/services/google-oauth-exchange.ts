import { ValidationError } from '../utils/errors';

type StrapiUser = {
  id: number;
  email?: string;
  username?: string;
  blocked?: boolean;
};

export async function exchangeGoogleAccessToken(strapi: any, accessToken: string) {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new ValidationError('access_token es requerido');
  }

  const providersService = strapi.plugin('users-permissions').service('providers');
  const user = (await providersService.connect('google', {
    access_token: accessToken,
  })) as StrapiUser;

  if (user.blocked) {
    throw new ValidationError('Tu cuenta fue bloqueada por un administrador');
  }

  const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

  return {
    jwt,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
}
