import { assertPlantillaSlotIndex } from '../crm-pieza';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const raw = ctx.request.body?.plantillaIndex ?? ctx.query?.plantillaIndex;
    ctx.state.crmPiezaSlot = assertPlantillaSlotIndex(raw);
    await next();
  };
};
