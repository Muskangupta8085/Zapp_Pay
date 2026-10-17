import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';

import { seedDatabaseIfEmpty } from './utils/seeder.js';

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
    await seedDatabaseIfEmpty();

    const server = app.listen(ENV.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Zapp Pay Backend running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      logger.info(`📡 Local Health Check: http://localhost:${ENV.PORT}/api/v1/health`);
      logger.info(`📱 LAN Health Check: http://192.168.1.22:${ENV.PORT}/api/v1/health`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
