import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import { apiLimiter } from './middleware/rateLimit.middleware.js';

const app: Application = express();

// Disable ETag to prevent 304 Not Modified caching on dynamic API endpoints
app.set('etag', false);

// Prevent browser/client caching of dynamic API responses
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if wildcard
      if (!origin || ENV.CORS_ORIGIN.includes('*') || ENV.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);
app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting across public API surface
app.use('/api', apiLimiter);

// API versioning
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
