import { Router } from 'express';
import { ServiceContext } from './service-context.js';
import { config } from './config.js';

const TEST_RECORD_ID = 'be2a626a-e895-491f-a8bb-eb0d15bcb44c';

export function createDevToolsRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.get('/test-nillion-list', async (_req, res) => {
    try {
      const result = await ctx.nillion.listAllAssets();
      res.json({
        success: true,
        collectionId: config.nillion.collectionId,
        rawResult: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to list from Nillion',
        message: error.message,
      });
    }
  });

  router.get('/test-nillion', async (_req, res) => {
    try {
      const asset = await ctx.nillion.getAsset(TEST_RECORD_ID);
      if (!asset) {
        return res.json({
          success: false,
          message: 'Record not found',
          recordId: TEST_RECORD_ID,
          collectionId: config.nillion.collectionId,
        });
      }

      res.json({
        success: true,
        message: 'Record found in Nillion',
        recordId: TEST_RECORD_ID,
        data: {
          _id: asset._id,
          title: asset.title,
          owner: asset.owner,
          productId: asset.productId,
          mimeType: asset.mimeType,
          hasEncryptedKey: !!asset.encryption?.wrappedKey,
          analytics: asset.analytics,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to read from Nillion',
        message: error.message,
        recordId: TEST_RECORD_ID,
      });
    }
  });

  return router;
}
