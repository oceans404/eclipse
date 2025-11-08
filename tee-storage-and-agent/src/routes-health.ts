import { Router } from 'express';
import { ServiceContext } from './service-context.js';
import { REQUIRED_ENV_VARS } from './config.js';

export function createHealthRouter(ctx: ServiceContext): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    const envVarsLoaded = missingEnvVars.length === 0;

    res.json({
      status: envVarsLoaded ? 'ok' : 'degraded',
      version: '1.0.0',
      services: {
        crypto: 'ready',
        nillion: ctx.nillion ? 'ready' : 'initializing',
        ai: ctx.ai ? 'ready' : 'initializing',
        blockchain: ctx.blockchain ? 'ready' : 'initializing',
      },
      environment: {
        varsLoaded: envVarsLoaded,
        missingCount: missingEnvVars.length,
      },
    });
  });

  return router;
}
