import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { routes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { apiLimiter } from './middleware/rate-limiter';

export const createApp = (): express.Application => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // Rate limiting para todas las rutas API
  app.use('/api/v1', apiLimiter);

  // Health check sin rate limiting
  app.get('/health', (_request, response) => {
    response.json({ success: true, data: { status: 'ok' } });
  });

  // API Routes
  app.use('/api/v1', routes);

  // 404 Handler
  app.use(notFoundHandler);

  // Error Handler
  app.use(errorHandler);

  return app;
};
