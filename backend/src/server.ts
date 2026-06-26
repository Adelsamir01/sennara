import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { closeDb } from './config/database';
import { closeRedis } from './config/redis';
import { AppError } from './shared/errors/AppError';
import { metricsMiddleware, metricsHandler } from './shared/metrics/metricsMiddleware';
import authRoutes from './modules/auth/routes/authRoutes';
import waypointRoutes from './modules/waypoints/routes/waypointRoutes';
import catchRoutes from './modules/catches/routes/catchRoutes';
import feedRoutes from './modules/feed/routes/feedRoutes';
import weatherRoutes from './modules/weather/routes/weatherRoutes';
import paymentRoutes from './modules/payments/routes/paymentRoutes';
import speciesRoutes from './modules/species/routes/speciesRoutes';
import uploadRoutes from './modules/uploads/routes/uploadRoutes';

export const app: Application = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet());
app.use(cors());
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

// Prometheus metrics
app.get('/metrics', metricsHandler);

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

  console.error(err);
  res.status(500).json({
    error: 'internal',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Only start HTTP server when this file is run directly (not imported by tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Sennara API listening on port ${PORT}`);
  });

  async function gracefulShutdown(signal: string) {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeRedis();
      await closeDb();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
