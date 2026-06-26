import { env, validateEnv } from './config/env';
validateEnv(); // load & validate env before anything else
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { logger } from './config/logger';
import { closeDb } from './config/database';
import { closeRedis } from './config/redis';
import { AppError } from './shared/errors/AppError';
import { metricsMiddleware, metricsHandler } from './shared/metrics/metricsMiddleware';
import authRoutes from './modules/auth/routes/authRoutes';
import whatsappWebhookRoutes from './modules/auth/routes/whatsappWebhookRoutes';
import waypointRoutes from './modules/waypoints/routes/waypointRoutes';
import catchRoutes from './modules/catches/routes/catchRoutes';
import feedRoutes from './modules/feed/routes/feedRoutes';
import weatherRoutes from './modules/weather/routes/weatherRoutes';
import paymentRoutes from './modules/payments/routes/paymentRoutes';
import speciesRoutes from './modules/species/routes/speciesRoutes';
import uploadRoutes from './modules/uploads/routes/uploadRoutes';

export const app: Application = express();
const PORT = env.PORT;
const API_PREFIX = env.API_PREFIX;

app.use(helmet());
app.use(cors());

// WhatsApp webhook endpoint mounted before express.json so we can verify
// Meta's X-Hub-Signature-256 against the raw request body.
app.use('/webhooks/whatsapp', express.raw({ type: 'application/json' }), whatsappWebhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));
app.use(metricsMiddleware);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'sennara-api' });
});

// Prometheus metrics (protected when METRICS_BASIC_AUTH_PASSWORD is set)
app.get('/metrics', metricsAuth, metricsHandler);

function metricsAuth(req: Request, res: Response, next: NextFunction): void {
  const password = env.METRICS_BASIC_AUTH_PASSWORD;
  if (!password) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="metrics"');
    res.status(401).json({ error: 'unauthorized', message: 'Metrics require basic auth' });
    return;
  }

  const provided = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')[1];
  if (provided !== password) {
    res.set('WWW-Authenticate', 'Basic realm="metrics"');
    res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
    return;
  }

  next();
}

// Root
app.get('/', (_req: Request, res: Response) => {
  res.json({ name: 'Sennara API', version: '0.1.0' });
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/waypoints`, waypointRoutes);
app.use(`${API_PREFIX}/catches`, catchRoutes);
app.use(`${API_PREFIX}/feed`, feedRoutes);
app.use(`${API_PREFIX}/weather`, weatherRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/species`, speciesRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);

// 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('notFound', 404));
});

// Global error handler
app.use((err: Error | AppError | ZodError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'validation',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  logger.error('Unhandled error', { err });
  res.status(500).json({
    error: 'internal',
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Only start HTTP server when this file is run directly (not imported by tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Sennara API listening on port ${PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeRedis();
      await closeDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
