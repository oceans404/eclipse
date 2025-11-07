import { Router } from 'express';
import { ServiceContext } from './service-context.js';
import { parseContentId } from './utils.js';

export function createMetadataRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.get('/asset-metadata/:contentId', async (req, res, next) => {
    try {
      const { recordId: assetId } = parseContentId(
        decodeURIComponent(req.params.contentId)
      );

      const asset = await ctx.nillion.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.json({
        assetId: asset._id,
        productId: asset.productId,
        title: asset.title,
        description: asset.description,
        owner: asset.owner,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        analytics: asset.analytics,
        createdAt: asset.createdAt,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
