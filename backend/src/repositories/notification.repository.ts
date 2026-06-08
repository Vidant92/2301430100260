// src/repositories/notification.repository.ts
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  Notification,
  CreateNotificationRequest,
  NotificationType,
  NotificationPriority,
  NotificationFilters,
  PaginationParams
} from '../models/notification.model';

/**
 * Mock in-memory database for notifications
 * In production, this would use PostgreSQL
 */
class NotificationRepository {
  private notifications: Map<string, Notification> = new Map();
  private studentNotifications: Map<string, Set<string>> = new Map();

  /**
   * Create a new notification
   */
  async create(request: CreateNotificationRequest): Promise<Notification> {
    try {
      const notification: Notification = {
        id: uuidv4(),
        studentId: request.studentId,
        title: request.title,
        message: request.message,
        type: request.type,
        priority: request.priority || NotificationPriority.MEDIUM,
        isRead: false,
        isDeleted: false,
        details: request.details,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.notifications.set(notification.id, notification);

      // Index by student
      if (!this.studentNotifications.has(request.studentId)) {
        this.studentNotifications.set(request.studentId, new Set());
      }
      this.studentNotifications.get(request.studentId)?.add(notification.id);

      logger.info('Notification created', {
        notificationId: notification.id,
        studentId: notification.studentId,
        type: notification.type
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getById(notificationId: string): Promise<Notification | null> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification || notification.isDeleted) {
        return null;
      }
      return notification;
    } catch (error) {
      logger.error('Error fetching notification by ID', error, { notificationId });
      throw error;
    }
  }

  /**
   * Get all notifications for a student with pagination
   */
  async getByStudent(
    studentId: string,
    params: PaginationParams
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notificationIds = this.studentNotifications.get(studentId) || new Set();
      const allNotifications = Array.from(notificationIds)
        .map(id => this.notifications.get(id))
        .filter(n => n && !n.isDeleted) as Notification[];

      // Sort by created date descending
      allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = allNotifications.length;
      const offset = (params.page - 1) * params.limit;
      const paginated = allNotifications.slice(offset, offset + params.limit);

      logger.info('Fetched student notifications', {
        studentId,
        total,
        page: params.page,
        limit: params.limit
      });

      return { notifications: paginated, total };
    } catch (error) {
      logger.error('Error fetching student notifications', error, { studentId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, studentId: string): Promise<Notification | null> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification || notification.isDeleted) {
        return null;
      }

      notification.isRead = true;
      notification.updatedAt = new Date();

      logger.info('Notification marked as read', { notificationId, studentId });
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read', error, { notificationId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a student
   */
  async markAllAsRead(studentId: string): Promise<string[]> {
    try {
      const notificationIds = this.studentNotifications.get(studentId) || new Set();
      const updatedIds: string[] = [];

      notificationIds.forEach(id => {
        const notification = this.notifications.get(id);
        if (notification && !notification.isDeleted && !notification.isRead) {
          notification.isRead = true;
          notification.updatedAt = new Date();
          updatedIds.push(id);
        }
      });

      logger.info('Marked all notifications as read', {
        studentId,
        count: updatedIds.length
      });

      return updatedIds;
    } catch (error) {
      logger.error('Error marking all notifications as read', error, { studentId });
      throw error;
    }
  }

  /**
   * Delete notification (soft delete)
   */
  async delete(notificationId: string, studentId: string): Promise<boolean> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) {
        return false;
      }

      notification.isDeleted = true;
      notification.updatedAt = new Date();

      logger.info('Notification deleted', { notificationId, studentId });
      return true;
    } catch (error) {
      logger.error('Error deleting notification', error, { notificationId });
      throw error;
    }
  }

  /**
   * Get notification statistics for a student
   */
  async getStats(studentId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
    byPriority: Record<number, number>;
  }> {
    try {
      const notificationIds = this.studentNotifications.get(studentId) || new Set();
      const notifications = Array.from(notificationIds)
        .map(id => this.notifications.get(id))
        .filter(n => n && !n.isDeleted) as Notification[];

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        read: notifications.filter(n => n.isRead).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<number, number>
      };

      notifications.forEach(n => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      });

      logger.info('Fetched notification statistics', { studentId, ...stats });
      return stats;
    } catch (error) {
      logger.error('Error fetching notification statistics', error, { studentId });
      throw error;
    }
  }

  /**
   * Get notifications with filters
   */
  async getFiltered(
    studentId: string,
    filters: NotificationFilters,
    params: PaginationParams
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notificationIds = this.studentNotifications.get(studentId) || new Set();
      let notifications = Array.from(notificationIds)
        .map(id => this.notifications.get(id))
        .filter(n => n && !n.isDeleted) as Notification[];

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        notifications = notifications.filter(n => filters.type!.includes(n.type));
      }

      if (filters.isRead !== undefined) {
        notifications = notifications.filter(n => n.isRead === filters.isRead);
      }

      if (filters.priority && filters.priority.length > 0) {
        notifications = notifications.filter(n => filters.priority!.includes(n.priority));
      }

      if (filters.dateFrom) {
        notifications = notifications.filter(n => n.createdAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        notifications = notifications.filter(n => n.createdAt <= filters.dateTo!);
      }

      // Sort by created date descending
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = notifications.length;
      const offset = (params.page - 1) * params.limit;
      const paginated = notifications.slice(offset, offset + params.limit);

      logger.info('Fetched filtered notifications', {
        studentId,
        filters,
        total,
        returned: paginated.length
      });

      return { notifications: paginated, total };
    } catch (error) {
      logger.error('Error fetching filtered notifications', error, { studentId });
      throw error;
    }
  }
}

export const notificationRepository = new NotificationRepository();
