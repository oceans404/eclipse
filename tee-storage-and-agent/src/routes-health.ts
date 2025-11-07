import { Router } from 'express';
import { ServiceContext } from './service-context.js';

export function createHealthRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      services: {
        crypto: 'ready',
        nillion: ctx.nillion ? 'ready' : 'initializing',
        ai: ctx.ai ? 'ready' : 'initializing',
        blockchain: ctx.blockchain ? 'ready' : 'initializing',
      },
    });
  });

  return router;
}
