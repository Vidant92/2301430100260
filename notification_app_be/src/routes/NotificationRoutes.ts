// notification_app_be/src/routes/NotificationRoutes.ts
import { Router } from 'express'
import { notificationController } from '../controllers/NotificationController'
import { Log } from '../../../logging-middleware/src/index'

const router = Router()

// POST /notifications - Create notification
router.post('/', async (req, res) => {
  await Log('backend', 'info', 'route', 'POST /notifications route hit')
  await notificationController.create(req, res)
})

// GET /notifications - Get all notifications
router.get('/', async (req, res) => {
  await Log('backend', 'info', 'route', 'GET /notifications route hit')
  await notificationController.getAll(req, res)
})

// GET /notifications/:id - Get notification by ID
router.get('/:id', async (req, res) => {
  await Log('backend', 'info', 'route', `GET /notifications/${req.params.id} route hit`)
  await notificationController.getById(req, res)
})

// DELETE /notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  await Log('backend', 'info', 'route', `DELETE /notifications/${req.params.id} route hit`)
  await notificationController.delete(req, res)
})

export default router
