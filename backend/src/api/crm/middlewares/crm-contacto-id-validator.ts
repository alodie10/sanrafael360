import { ValidationError } from '../../../utils/errors';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    if (!ctx.params?.documentId) {
      throw new ValidationError('documentId es requerido');
    }
    await next();
  };
};
