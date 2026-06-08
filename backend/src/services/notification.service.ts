// src/services/notification.service.ts
import { logger } from '../utils/logger';
import { notificationRepository } from '../repositories/notification.repository';
import {
  Notification,
  CreateNotificationRequest,
  NotificationFilters,
  PaginationParams,
  PaginationMeta,
  ApiResponse
} from '../models/notification.model';

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    request: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      logger.info('Creating new notification', { studentId: request.studentId });
      const notification = await notificationRepository.create(request);
      return notification;
    } catch (error) {
      logger.error('Error creating notification', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      logger.info('Fetching notification by ID', { notificationId: id });
      const notification = await notificationRepository.getById(id);
      return notification;
    } catch (error) {
      logger.error('Error fetching notification', error, { notificationId: id });
      throw new Error('Failed to fetch notification');
    }
  }

  /**
   * Get all notifications for a student
   */
  async getStudentNotifications(
    studentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; pagination: PaginationMeta }> {
    try {
      logger.info('Fetching student notifications', { studentId, page, limit });

      const { notifications, total } = await notificationRepository.getByStudent(
        studentId,
        { page, limit }
      );

      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };

      return { notifications, pagination };
    } catch (error) {
      logger.error('Error fetching student notifications', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    notificationId: string,
    studentId: string
  ): Promise<Notification | null> {
    try {
      logger.info('Marking notification as read', { notificationId, studentId });
      const notification = await notificationRepository.markAsRead(
        notificationId,
        studentId
      );
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(studentId: string): Promise<{ updatedCount: number }> {
    try {
      logger.info('Marking all notifications as read', { studentId });
      const updatedIds = await notificationRepository.markAllAsRead(studentId);
      return { updatedCount: updatedIds.length };
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
    studentId: string
  ): Promise<boolean> {
    try {
      logger.info('Deleting notification', { notificationId, studentId });
      const deleted = await notificationRepository.delete(notificationId, studentId);
      return deleted;
    } catch (error) {
      logger.error('Error deleting notification', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(studentId: string) {
    try {
      logger.info('Fetching notification statistics', { studentId });
      const stats = await notificationRepository.getStats(studentId);
      return stats;
    } catch (error) {
      logger.error('Error fetching notification statistics', error);
      throw new Error('Failed to fetch notification statistics');
    }
  }

  /**
   * Get filtered notifications
   */
  async getFilteredNotifications(
    studentId: string,
    filters: NotificationFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; pagination: PaginationMeta }> {
    try {
      logger.info('Fetching filtered notifications', { studentId, filters, page, limit });

      const { notifications, total } = await notificationRepository.getFiltered(
        studentId,
        filters,
        { page, limit }
      );

      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };

      return { notifications, pagination };
    } catch (error) {
      logger.error('Error fetching filtered notifications', error);
      throw new Error('Failed to fetch filtered notifications');
    }
  }
}

export const notificationService = new NotificationService();
