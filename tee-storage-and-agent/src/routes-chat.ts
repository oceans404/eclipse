import { Router } from 'express';
import { ServiceContext } from './service-context.js';
import { parseContentId, fetchBlobContent } from './utils.js';

export function createChatRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.post('/chat-with-asset', async (req, res, next) => {
    try {
      const { contentId, userMessage } = req.body;

      if (!contentId || !userMessage) {
        return res
          .status(400)
          .json({ error: 'Missing contentId or userMessage' });
      }

      const { recordId: assetId } = parseContentId(contentId);
      const asset = await ctx.nillion.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const encryptedBuffer = await fetchBlobContent(asset.blobUrl);
      const decryptedBuffer = ctx.crypto.decryptFile(
        encryptedBuffer,
        asset.encryption.wrappedKey,
        asset.encryption.iv,
        asset.encryption.authTag
      );

      const aiResponse = await ctx.ai.processContent(
        decryptedBuffer,
        asset.mimeType,
        userMessage
      );

      await ctx.nillion.incrementChatCount(assetId);

      decryptedBuffer.fill(0);

      res.json({
        reply: aiResponse,
        tokens_used: aiResponse.length,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
