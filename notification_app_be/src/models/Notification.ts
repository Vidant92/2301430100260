// notification_app_be/src/models/Notification.ts

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  createdAt: Date
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type: string
}
