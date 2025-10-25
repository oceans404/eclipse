import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { CryptoService } from './crypto.js';
import { NillionService } from './nillion.js';
import { AIService } from './ai.js';
import { BlockchainService } from './blockchain.js';
import { randomUUID } from 'crypto';

// Initialize services
const app = express();
const crypto = new CryptoService();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Services that need async initialization
let nillion: NillionService;
let ai: AIService;
let blockchain: BlockchainService;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    services: {
      crypto: 'ready',
      nillion: nillion ? 'ready' : 'initializing',
      ai: ai ? 'ready' : 'initializing',
      blockchain: blockchain ? 'ready' : 'initializing'
    }
  });
});

// Test endpoint to list all records in Nillion collection
app.get('/test-nillion-list', async (_req: Request, res: Response) => {
  try {
    if (!nillion) {
      return res.status(503).json({ error: 'Nillion service not initialized' });
    }
    
    console.log('[TEST] Calling listAllAssets...');
    const result = await nillion.listAllAssets();
    
    res.json({
      success: true,
      collectionId: process.env.NILLION_COLLECTION_ID,
      rawResult: result,
      message: 'See rawResult for the complete response structure'
    });
  } catch (error: any) {
    console.error('[TEST] Error listing from Nillion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list from Nillion',
      message: error.message
    });
  }
});

// Test endpoint to read hardcoded Nillion record
app.get('/test-nillion', async (_req: Request, res: Response) => {
  const TEST_RECORD_ID = 'be2a626a-e895-491f-a8bb-eb0d15bcb44c';
  
  try {
    if (!nillion) {
      return res.status(503).json({ error: 'Nillion service not initialized' });
    }
    
    console.log(`[TEST] Attempting to read record: ${TEST_RECORD_ID}`);
    const asset = await nillion.getAsset(TEST_RECORD_ID);
    
    if (asset) {
      console.log('[TEST] Successfully retrieved record from Nillion');
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
          analytics: asset.analytics
        }
      });
    } else {
      console.log('[TEST] Record not found in Nillion');
      res.json({
        success: false,
        message: 'Record not found',
        recordId: TEST_RECORD_ID,
        collectionId: process.env.NILLION_COLLECTION_ID
      });
    }
  } catch (error: any) {
    console.error('[TEST] Error reading from Nillion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read from Nillion',
      message: error.message,
      recordId: TEST_RECORD_ID
    });
  }
});

/**
 * POST /encrypt-asset
 * Encrypts a file and stores metadata in Nillion
 */
app.post('/encrypt-asset', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { productId, owner, title, description } = req.body;
    
    if (!productId || !owner || !title) {
      return res.status(400).json({ error: 'Missing required fields: productId, owner, title' });
    }

    // Generate asset ID
    const assetId = randomUUID();
    
    // Encrypt the file
    console.log(`Encrypting file for asset ${assetId}`);
    const encrypted = crypto.encryptFile(req.file.buffer);
    
    // Store metadata in Nillion (blob URL will be updated later)
    const assetData = {
      _id: assetId,
      productId,
      owner,
      title,
      description: description || '',
      blobUrl: '', // Will be updated after Vercel Blob upload
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      encryption: {
        algorithm: encrypted.algorithm,
        wrappedKey: {
          '%allot': encrypted.wrappedKey // Nillion will encrypt this
        },
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion
      },
      analytics: {
        totalChats: 0,
        totalDownloads: 0,
        lastAccessedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store metadata in Nillion first (without blob URL)
    await nillion.storeAsset(assetData);
    console.log(`Stored asset metadata in Nillion: ${assetId}`);

    // Upload encrypted file to Vercel Blob
    console.log(`Uploading encrypted file to Vercel Blob...`);
    const blobName = `encrypted-assets/${assetId}/${req.file.originalname}.enc`;
    
    try {
      const { url } = await put(blobName, encrypted.encryptedBuffer, {
        access: 'public',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      
      console.log(`Uploaded to Vercel Blob: ${url}`);
      
      // Update Nillion record with blob URL
      await nillion.updateAssetBlobUrl(assetId, url);
      console.log(`Updated Nillion record with blob URL`);
      
      res.json({
        assetId,
        nillionCollectionId: process.env.NILLION_COLLECTION_ID,
        nillionRecordId: assetId, // In this implementation, assetId serves as the record ID
        blobUrl: url,
        success: true,
        message: 'File encrypted and uploaded successfully',
        contentId: `nillion://${process.env.NILLION_COLLECTION_ID}/${assetId}` // Formatted for smart contract
      });
    } catch (blobError: any) {
      console.error('Failed to upload to Vercel Blob:', blobError);
      // Even if blob upload fails, we have the metadata in Nillion
      res.json({
        assetId,
        nillionCollectionId: process.env.NILLION_COLLECTION_ID,
        nillionRecordId: assetId,
        success: false,
        message: 'File encrypted but blob upload failed',
        error: blobError.message,
        contentId: `nillion://${process.env.NILLION_COLLECTION_ID}/${assetId}`
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /update-asset-blob-url
 * Updates the Vercel Blob URL after upload
 */
app.post('/update-asset-blob-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, blobUrl } = req.body;
    
    if (!assetId || !blobUrl) {
      return res.status(400).json({ error: 'Missing assetId or blobUrl' });
    }

    await nillion.updateAssetBlobUrl(assetId, blobUrl);
    console.log(`Updated blob URL for asset ${assetId}`);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /chat-with-asset
 * AI processes encrypted content to provide safe responses
 */
app.post('/chat-with-asset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, userMessage, userAddress } = req.body;
    
    if (!contentId || !userMessage) {
      return res.status(400).json({ error: 'Missing contentId or userMessage' });
    }

    // Parse contentId to get the asset ID
    const { recordId: assetId } = parseContentId(contentId);

    // Get asset from Nillion
    const asset = await nillion.getAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Fetch encrypted file from blob URL
    const encryptedBuffer = await fetchBlobContent(asset.blobUrl);

    // Decrypt in memory
    const decryptedBuffer = crypto.decryptFile(
      encryptedBuffer,
      asset.encryption.wrappedKey,
      asset.encryption.iv,
      asset.encryption.authTag
    );

    // Process with AI (with guardrails)
    const aiResponse = await ai.processContent(
      decryptedBuffer,
      asset.mimeType,
      userMessage
    );

    // Update analytics
    await nillion.incrementChatCount(assetId);

    // Clear decrypted content from memory
    decryptedBuffer.fill(0);

    res.json({
      reply: aiResponse,
      tokens_used: aiResponse.length // Simplified for POC
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /decrypt-for-download
 * Returns decrypted file for authorized users
 */
app.post('/decrypt-for-download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, requesterAddress, productId } = req.body;
    
    if (!contentId || !requesterAddress) {
      return res.status(400).json({ error: 'Missing contentId or requesterAddress' });
    }

    // Parse contentId to get the asset ID
    const { recordId: assetId } = parseContentId(contentId);

    // Get asset from Nillion to retrieve the metadata
    const asset = await nillion.getAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Use the productId from the request if provided, otherwise fall back to asset's productId
    const verifyProductId = productId || asset.productId;
    
    // Skip blockchain verification if productId is "temp" or invalid
    if (verifyProductId === 'temp' || !verifyProductId) {
      return res.status(400).json({ error: 'Invalid product ID for verification' });
    }

    // Verify on-chain purchase using the productId
    const hasPurchased = await blockchain.verifyPurchase(requesterAddress, verifyProductId);
    if (!hasPurchased) {
      return res.status(403).json({ error: 'Purchase not found' });
    }

    // Fetch and decrypt file
    const encryptedBuffer = await fetchBlobContent(asset.blobUrl);
    const decryptedBuffer = crypto.decryptFile(
      encryptedBuffer,
      asset.encryption.wrappedKey,
      asset.encryption.iv,
      asset.encryption.authTag
    );

    // Update analytics
    await nillion.incrementDownloadCount(assetId);

    // Set headers and send file
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${asset.title}"`);
    res.send(decryptedBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /asset-metadata/:contentId
 * Returns basic metadata without sensitive information
 */
app.get('/asset-metadata/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse contentId from URL parameter
    const { recordId: assetId } = parseContentId(decodeURIComponent(req.params.contentId));
    
    const asset = await nillion.getAsset(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Return only non-sensitive metadata
    res.json({
      assetId: asset._id,
      productId: asset.productId,
      title: asset.title,
      description: asset.description,
      owner: asset.owner,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      analytics: asset.analytics,
      createdAt: asset.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Helper function to parse contentId format
function parseContentId(contentId: string): { collectionId: string; recordId: string } {
  // Expected format: nillion://collectionId/recordId
  const match = contentId.match(/^nillion:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    throw new Error('Invalid contentId format. Expected: nillion://collectionId/recordId');
  }
  return {
    collectionId: match[1],
    recordId: match[2]
  };
}

// Helper function to fetch blob content
async function fetchBlobContent(blobUrl: string): Promise<Buffer> {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

// Initialize services and start server
async function start() {
  try {
    console.log('Initializing services...');
    
    // Initialize async services
    nillion = new NillionService();
    await nillion.initialize();
    console.log('Nillion service initialized');
    
    ai = new AIService();
    console.log('AI service initialized');
    
    blockchain = new BlockchainService();
    console.log('Blockchain service initialized');
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Encryption service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

// Start the service
start();