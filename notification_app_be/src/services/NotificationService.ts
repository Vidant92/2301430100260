// notification_app_be/src/services/NotificationService.ts
import { notificationRepository } from '../repositories/NotificationRepository'
import { Notification, CreateNotificationRequest } from '../models/Notification'
import { Log } from '../../../logging-middleware/src/index'

class NotificationService {
  async create(data: CreateNotificationRequest): Promise<Notification> {
    await Log('backend', 'info', 'service', 'Creating notification')

    // Validation
    if (!data.title) {
      await Log('backend', 'warn', 'service', 'Missing title')
      throw new Error('Title is required')
    }

    if (!data.message) {
      await Log('backend', 'warn', 'service', 'Missing message')
      throw new Error('Message is required')
    }

    if (!data.type) {
      await Log('backend', 'warn', 'service', 'Missing type')
      throw new Error('Type is required')
    }

    const notification = await notificationRepository.create(data)
    await Log('backend', 'info', 'service', `Notification created: ${notification.id}`)

    return notification
  }

  async getAll(): Promise<Notification[]> {
    await Log('backend', 'debug', 'service', 'Fetching all notifications')
    return await notificationRepository.getAll()
  }

  async getById(id: string): Promise<Notification | null> {
    await Log('backend', 'debug', 'service', `Fetching notification: ${id}`)
    return await notificationRepository.getById(id)
  }

  async delete(id: string): Promise<boolean> {
    await Log('backend', 'info', 'service', `Deleting notification: ${id}`)

    const exists = await notificationRepository.getById(id)
    if (!exists) {
      await Log('backend', 'warn', 'service', `Cannot delete - notification not found: ${id}`)
      throw new Error('Notification not found')
    }

    return await notificationRepository.delete(id)
  }
}

export const notificationService = new NotificationService()
