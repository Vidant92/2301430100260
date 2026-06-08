// notification_app_be/src/controllers/NotificationController.ts
import { Request, Response } from 'express'
import { notificationService } from '../services/NotificationService'
import { Log } from '../../../logging-middleware/src/index'

class NotificationController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      await Log('backend', 'info', 'controller', 'POST /notifications called')

      const { title, message, type } = req.body

      // Validation
      if (!title) {
        await Log('backend', 'warn', 'controller', 'POST /notifications - missing title')
        res.status(400).json({ error: 'Title is required' })
        return
      }

      if (!message) {
        await Log('backend', 'warn', 'controller', 'POST /notifications - missing message')
        res.status(400).json({ error: 'Message is required' })
        return
      }

      if (!type) {
        await Log('backend', 'warn', 'controller', 'POST /notifications - missing type')
        res.status(400).json({ error: 'Type is required' })
        return
      }

      const notification = await notificationService.create({ title, message, type })
      await Log('backend', 'info', 'controller', `Notification created: ${notification.id}`)

      res.status(201).json({ success: true, data: notification })
    } catch (error: any) {
      await Log('backend', 'error', 'controller', `Error creating notification: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      await Log('backend', 'info', 'controller', 'GET /notifications called')

      const notifications = await notificationService.getAll()
      await Log('backend', 'debug', 'controller', `Retrieved ${notifications.length} notifications`)

      res.status(200).json({ success: true, data: notifications })
    } catch (error: any) {
      await Log('backend', 'error', 'controller', `Error fetching notifications: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await Log('backend', 'info', 'controller', `GET /notifications/${id} called`)

      const notification = await notificationService.getById(id)

      if (!notification) {
        await Log('backend', 'warn', 'controller', `Notification not found: ${id}`)
        res.status(404).json({ error: 'Notification not found' })
        return
      }

      res.status(200).json({ success: true, data: notification })
    } catch (error: any) {
      await Log('backend', 'error', 'controller', `Error fetching notification: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await Log('backend', 'info', 'controller', `DELETE /notifications/${id} called`)

      const deleted = await notificationService.delete(id)

      if (!deleted) {
        await Log('backend', 'warn', 'controller', `Failed to delete notification: ${id}`)
        res.status(404).json({ error: 'Notification not found' })
        return
      }

      await Log('backend', 'info', 'controller', `Notification deleted: ${id}`)
      res.status(200).json({ success: true, message: 'Notification deleted' })
    } catch (error: any) {
      await Log('backend', 'error', 'controller', `Error deleting notification: ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }
}

export const notificationController = new NotificationController()
