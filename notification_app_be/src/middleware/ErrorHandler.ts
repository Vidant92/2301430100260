// notification_app_be/src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { Log } from '../../../logging-middleware/src/index'

export async function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  await Log('backend', 'error', 'middleware', `Unhandled error: ${err.message}`)

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
}
