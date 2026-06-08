// src/server.ts
import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  logger.info(`Notification API Server Started`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    url: `http://localhost:${PORT}`
  });

  logger.info('Available Endpoints', {
    endpoints: [
      'GET /health',
      'GET /api/notifications',
      'GET /api/notifications/:id',
      'GET /api/notifications/stats',
      'POST /api/notifications',
      'POST /api/notifications/filter',
      'PATCH /api/notifications/:id/read',
      'PATCH /api/notifications/read-all',
      'DELETE /api/notifications/:id'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason as Error);
  process.exit(1);
});

export default server;
