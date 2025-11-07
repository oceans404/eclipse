import express, { NextFunction, Request, Response } from 'express';
import { createServiceContext } from './service-context.js';
import { createHealthRouter } from './routes-health.js';
import { createDevToolsRouter } from './routes-dev-tools.js';
import { createAssetRouter } from './routes-assets.js';
import { createChatRouter } from './routes-chat.js';
import { createDecryptRouter } from './routes-decrypt.js';
import { createMetadataRouter } from './routes-metadata.js';
import { createVerifiedListRouter } from './routes-verified-list.js';
import { config, isProduction } from './config.js';
import { extractFriendlyMessage } from './utils.js';

async function start() {
  try {
    console.log('Initializing services...');
    const services = await createServiceContext();
    console.log('Services initialized');

    const app = express();
    app.use(express.json({ limit: '50mb' }));

    app.use(createHealthRouter(services));
    if (!isProduction) {
      app.use(createDevToolsRouter(services));
    }
    app.use(createAssetRouter(services));
    app.use(createChatRouter(services));
    app.use(createDecryptRouter(services));
    app.use(createMetadataRouter(services));
    app.use(createVerifiedListRouter(services));

    app.use(
      (
        err: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
      ) => {
        console.error('Error:', err);
        const friendly = extractFriendlyMessage(err);
        res.status(friendly.status).json({
          error: friendly.short,
          message:
            config.env === 'development' ? friendly.detail : undefined,
        });
      }
    );

    app.listen(config.port, () => {
      console.log(`Encryption service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
