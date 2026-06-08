// src/config/index.ts
import path from 'path';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'notification_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    enabled: process.env.REDIS_ENABLED === 'true' || false,
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT || '5001'),
    enabled: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'text', // 'text' or 'json'
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Cache
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    notificationCountTtl: 1 * 60 * 1000, // 1 minute
  },

  // Feature flags
  features: {
    enableWebSocket: true,
    enableRedisCache: false,
    enableEventQueue: false,
  },
};

export default config;
