import { NotFoundError } from '../../../utils/errors';
import { isPiezaToken } from '../crm-pieza';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (!isPiezaToken(ctx.params?.token)) throw new NotFoundError('Pieza');
    await next();
  };
};
