// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestWithId extends Request {
  requestId?: string;
}

interface ApiError extends Error {
  statusCode?: number;
  context?: any;
}

export const errorHandlerMiddleware = (
  err: ApiError,
  req: RequestWithId,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId || 'unknown';
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`API Error`, err, {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message,
    context: err.context
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
};
