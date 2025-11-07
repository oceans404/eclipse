import { Router } from 'express';
import { ServiceContext } from './service-context.js';
import { parseContentId, fetchBlobContent } from './utils.js';

export function createDecryptRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.post('/decrypt-for-download', async (req, res, next) => {
    try {
      const { contentId, requesterAddress, productId } = req.body;

      if (!contentId || !requesterAddress) {
        return res
          .status(400)
          .json({ error: 'Missing contentId or requesterAddress' });
      }

      const { recordId: assetId } = parseContentId(contentId);
      const asset = await ctx.nillion.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const verifyProductId = productId || asset.productId;
      if (verifyProductId === 'temp' || !verifyProductId) {
        return res
          .status(400)
          .json({ error: 'Invalid product ID for verification' });
      }

      const hasPurchased = await ctx.blockchain.verifyPurchase(
        requesterAddress,
        verifyProductId
      );
      if (!hasPurchased) {
        return res.status(403).json({ error: 'Purchase not found' });
      }

      const encryptedBuffer = await fetchBlobContent(asset.blobUrl);
      const decryptedBuffer = ctx.crypto.decryptFile(
        encryptedBuffer,
        asset.encryption.wrappedKey,
        asset.encryption.iv,
        asset.encryption.authTag
      );

      await ctx.nillion.incrementDownloadCount(assetId);

      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${asset.title}"`
      );
      res.send(decryptedBuffer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
