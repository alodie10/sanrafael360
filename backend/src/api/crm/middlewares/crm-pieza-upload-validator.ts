import { assertPiezaImage, assertPlantillaSlotIndex, pickPiezaFile } from '../crm-pieza';

export default (_config: unknown) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const file = pickPiezaFile(ctx.request.files);
    assertPiezaImage(file);
    ctx.state.crmPiezaUpload = {
      slotIndex: assertPlantillaSlotIndex(ctx.request.body?.plantillaIndex),
      file,
    };
    await next();
  };
};
