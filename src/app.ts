import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from '@/config';
import { errorHandler, notFound } from '@/middleware/error';

interface CreateAppOptions {
  name: string;
  description: string;
  routes: Array<{ path: string; router: Router }>;
}

export const createApp = ({ name, description, routes }: CreateAppOptions) => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => (
      req.method === 'OPTIONS' ||
      req.path === '/health' ||
      req.path.startsWith('/api/auth/')
    ),
  }));

  app.use(express.json({ limit: '40mb' }));
  app.use(express.urlencoded({ extended: true, limit: '40mb' }));
  app.use(compression());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  if (config.env === 'development') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: name,
      description,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    });
  });

  const apiRouter = Router();
  routes.forEach(({ path: routePath, router }) => {
    apiRouter.use(routePath, router);
  });
  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
