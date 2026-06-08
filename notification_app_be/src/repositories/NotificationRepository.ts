// notification_app_be/src/repositories/NotificationRepository.ts
import { Notification, CreateNotificationRequest } from '../models/Notification'
import { Log } from '../../../logging-middleware/src/index'
import { v4 as uuidv4 } from 'uuid'

class NotificationRepository {
  private notifications: Notification[] = []

  async create(data: CreateNotificationRequest): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      title: data.title,
      message: data.message,
      type: data.type,
      createdAt: new Date(),
    }

    this.notifications.push(notification)

    await Log('backend', 'info', 'repository', `Created notification with ID: ${notification.id}`)

    return notification
  }

  async getAll(): Promise<Notification[]> {
    await Log('backend', 'debug', 'repository', `Retrieved all notifications. Count: ${this.notifications.length}`)
    return this.notifications
  }

  async getById(id: string): Promise<Notification | null> {
    const notification = this.notifications.find((n) => n.id === id)

    if (notification) {
      await Log('backend', 'debug', 'repository', `Retrieved notification: ${id}`)
    } else {
      await Log('backend', 'warn', 'repository', `Notification not found: ${id}`)
    }

    return notification || null
  }

  async delete(id: string): Promise<boolean> {
    const index = this.notifications.findIndex((n) => n.id === id)

    if (index !== -1) {
      this.notifications.splice(index, 1)
      await Log('backend', 'info', 'repository', `Deleted notification: ${id}`)
      return true
    }

    await Log('backend', 'warn', 'repository', `Failed to delete - notification not found: ${id}`)
    return false
  }
}

export const notificationRepository = new NotificationRepository()
