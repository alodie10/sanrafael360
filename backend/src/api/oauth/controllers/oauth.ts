import { asyncHandler } from '../../../utils/asyncHandler';
import { ValidationError } from '../../../utils/errors';
import { exchangeGoogleAccessToken } from '../../../services/google-oauth-exchange';

export default {
  exchangeGoogle: asyncHandler(async (ctx) => {
    const accessToken = ctx.request.body?.access_token;

    if (!accessToken) {
      throw new ValidationError('access_token es requerido');
    }

    const result = await exchangeGoogleAccessToken(strapi, accessToken);
    ctx.send(result);
  }),
};
