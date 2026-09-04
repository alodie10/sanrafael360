import { reindexNegociosForCategoria } from '../../../negocio/services/algolia';

export default {
  async afterUpdate(event: { result?: { documentId?: string } }) {
    const documentId = event.result?.documentId;
    if (!documentId) return;
    try {
      await reindexNegociosForCategoria(documentId);
    } catch (err) {
      console.error(`[Algolia] Error reindexing categoria ${documentId}:`, err);
    }
  },
};
