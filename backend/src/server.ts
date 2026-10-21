import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';

import { seedDatabaseIfEmpty } from './utils/seeder.js';
import { ReconciliationService } from './services/reconciliation.service.js';

import os from 'os';

const getLanIp = (): string => {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
    await seedDatabaseIfEmpty();

    // Start background financial reconciliation worker
    ReconciliationService.startReconciliationWorker();

    const server = app.listen(ENV.PORT, '0.0.0.0', () => {
      const lanIp = getLanIp();
      logger.info(`🚀 Zapp Pay Backend running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      logger.info(`📡 Local Health Check: http://localhost:${ENV.PORT}/api/v1/health`);
      logger.info(`📱 LAN Health Check: http://${lanIp}:${ENV.PORT}/api/v1/health`);
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
