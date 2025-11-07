import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { ServiceContext } from './service-context.js';
import { config } from './config.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export function createAssetRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.post(
    '/encrypt-asset',
    upload.single('file'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const { productId, owner, title, description } = req.body;
        if (!productId || !owner || !title) {
          return res.status(400).json({
            error: 'Missing required fields: productId, owner, title',
          });
        }

        const assetId = randomUUID();
        const encrypted = ctx.crypto.encryptFile(req.file.buffer);

        const assetData = {
          _id: assetId,
          productId,
          owner,
          title,
          description: description || '',
          blobUrl: '',
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          encryption: {
            algorithm: encrypted.algorithm,
            wrappedKey: {
              '%allot': encrypted.wrappedKey,
            },
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            keyVersion: encrypted.keyVersion,
          },
          analytics: {
            totalChats: 0,
            totalDownloads: 0,
            lastAccessedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await ctx.nillion.storeAsset(assetData);

        const blobName = `encrypted-assets/${assetId}/${req.file.originalname}.enc`;
        try {
          const { url } = await put(blobName, encrypted.encryptedBuffer, {
            access: 'public',
            addRandomSuffix: false,
            token: config.blob.token,
          });

          await ctx.nillion.updateAssetBlobUrl(assetId, url);

          res.json({
            assetId,
            nillionCollectionId: config.nillion.collectionId,
            nillionRecordId: assetId,
            blobUrl: url,
            success: true,
            message: 'File encrypted and uploaded successfully',
            contentId: `nillion://${config.nillion.collectionId}/${assetId}`,
          });
        } catch (blobError: any) {
          res.json({
            assetId,
            nillionCollectionId: config.nillion.collectionId,
            nillionRecordId: assetId,
            success: false,
            message: 'File encrypted but blob upload failed',
            error: blobError.message,
            contentId: `nillion://${config.nillion.collectionId}/${assetId}`,
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  router.post('/update-asset-blob-url', async (req, res, next) => {
    try {
      const { assetId, blobUrl } = req.body;
      if (!assetId || !blobUrl) {
        return res.status(400).json({ error: 'Missing assetId or blobUrl' });
      }

      await ctx.nillion.updateAssetBlobUrl(assetId, blobUrl);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
