// src/middleware/request-logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithId extends Request {
  requestId?: string;
}

export const requestLoggerMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4();

  // Log incoming request
  const startTime = Date.now();
  logger.info(`Incoming Request`, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [hidden]' : 'None'
    }
  });

  // Log request body for POST/PATCH requests
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    logger.debug(`Request Body`, {
      requestId: req.requestId,
      body: req.body
    });
  }

  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info(`Outgoing Response`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    });

    if (res.statusCode >= 400) {
      logger.warn(`HTTP Error Response`, {
        requestId: req.requestId,
        statusCode: res.statusCode,
        path: req.path
      });
    }

    return originalSend.call(this, data);
  };

  next();
};
