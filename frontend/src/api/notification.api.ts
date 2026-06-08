// src/api/notification.api.ts
import axiosClient from './axiosClient'
import { logger } from '../utils/logger'

export interface Notification {
  id: string
  studentId: string
  title: string
  message: string
  type: 'PLACEMENT' | 'RESULT' | 'EVENT'
  priority: number
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
  byType: Record<string, number>
  byPriority: Record<string, number>
}

const STUDENT_ID = '2301430100260'

export const notificationAPI = {
  // Get all notifications
  getAll: async (page = 1, limit = 20) => {
    try {
      logger.info('Fetching all notifications', { page, limit })
      const response = await axiosClient.get('/notifications', {
        params: {
          studentId: STUDENT_ID,
          page,
          limit,
        },
      })
      return response.data
    } catch (error) {
      logger.error('Error fetching notifications', error)
      throw error
    }
  },

  // Get notification by ID
  getById: async (id: string) => {
    try {
      logger.info('Fetching notification', { id })
      const response = await axiosClient.get(`/notifications/${id}`)
      return response.data
    } catch (error) {
      logger.error('Error fetching notification', error, { id })
      throw error
    }
  },

  // Create notification
  create: async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>) => {
    try {
      logger.info('Creating notification', { title: notification.title })
      const response = await axiosClient.post('/notifications', {
        ...notification,
        studentId: STUDENT_ID,
      })
      return response.data
    } catch (error) {
      logger.error('Error creating notification', error)
      throw error
    }
  },

  // Mark as read
  markAsRead: async (id: string) => {
    try {
      logger.info('Marking notification as read', { id })
      const response = await axiosClient.patch(`/notifications/${id}/read`, {
        studentId: STUDENT_ID,
      })
      return response.data
    } catch (error) {
      logger.error('Error marking notification as read', error, { id })
      throw error
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      logger.info('Marking all notifications as read')
      const response = await axiosClient.patch('/notifications/read-all', {
        studentId: STUDENT_ID,
      })
      return response.data
    } catch (error) {
      logger.error('Error marking all notifications as read', error)
      throw error
    }
  },

  // Delete notification
  delete: async (id: string) => {
    try {
      logger.info('Deleting notification', { id })
      const response = await axiosClient.delete(`/notifications/${id}`, {
        data: {
          studentId: STUDENT_ID,
        },
      })
      return response.data
    } catch (error) {
      logger.error('Error deleting notification', error, { id })
      throw error
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      logger.info('Fetching notification statistics')
      const response = await axiosClient.get('/notifications/stats', {
        params: {
          studentId: STUDENT_ID,
        },
      })
      return response.data
    } catch (error) {
      logger.error('Error fetching statistics', error)
      throw error
    }
  },

  // Get filtered notifications
  getFiltered: async (filters: any, page = 1, limit = 20) => {
    try {
      logger.info('Fetching filtered notifications', { filters, page, limit })
      const response = await axiosClient.post('/notifications/filter', {
        studentId: STUDENT_ID,
        filters,
        page,
        limit,
      })
      return response.data
    } catch (error) {
      logger.error('Error fetching filtered notifications', error)
      throw error
    }
  },
}
