// notification_app_be/src/middleware/RequestLogger.ts
import { Request, Response, NextFunction } from 'express'
import { Log } from '../../../logging-middleware/src/index'

export async function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  await Log('backend', 'debug', 'middleware', `Incoming ${req.method} ${req.path}`)

  res.on('finish', async () => {
    const duration = Date.now() - start
    await Log('backend', 'debug', 'middleware', `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })

  next()
}
