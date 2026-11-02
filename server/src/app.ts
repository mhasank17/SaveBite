import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/errorMiddleware';
import { ENV } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Security headers (allow cross-origin resources for uploaded images)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration for client
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  // Serve static public uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Body parsing (preserve raw body for Razorpay webhook HMAC signature verification)
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routing
  app.use('/api/v1', routes);

  // Fallback 404 handler for unmatched routes (always return valid JSON)
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
