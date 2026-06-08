// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notification.service';
import {
  CreateNotificationRequest,
  NotificationType,
  NotificationFilters
} from '../models/notification.model';

interface RequestWithId extends Request {
  requestId?: string;
}

class NotificationController {
  /**
   * Create notification
   * POST /api/notifications
   */
  async createNotification(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const { studentId, title, message, type, priority, details } = req.body;

      const createRequest: CreateNotificationRequest = {
        studentId,
        title,
        message,
        type: type as NotificationType,
        priority,
        details
      };

      const notification = await notificationService.createNotification(createRequest);

      logger.info('Notification created via API', {
        requestId: req.requestId,
        notificationId: notification.id
      });

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error creating notification', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Get notification by ID
   * GET /api/notifications/:id
   */
  async getNotificationById(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const notification = await notificationService.getNotificationById(id);

      if (!notification) {
        logger.warn('Notification not found', {
          requestId: req.requestId,
          notificationId: id
        });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error fetching notification', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Get all notifications for student
   * GET /api/notifications?page=1&limit=20
   */
  async getNotifications(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const studentId = req.query.studentId as string || '2301430100260';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { notifications, pagination } = await notificationService.getStudentNotifications(
        studentId,
        page,
        limit
      );

      res.json({
        success: true,
        data: {
          notifications,
          pagination
        }
      });
    } catch (error) {
      logger.error('Error fetching notifications', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const studentId = req.body.studentId || '2301430100260';

      const notification = await notificationService.markNotificationAsRead(id, studentId);

      if (!notification) {
        logger.warn('Notification not found for mark as read', {
          requestId: req.requestId,
          notificationId: id
        });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: {
          id: notification.id,
          isRead: notification.isRead,
          updatedAt: notification.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error marking notification as read', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const studentId = req.body.studentId || '2301430100260';

      const { updatedCount } = await notificationService.markAllAsRead(studentId);

      logger.info('All notifications marked as read', {
        requestId: req.requestId,
        studentId,
        updatedCount
      });

      res.json({
        success: true,
        data: {
          updatedCount,
          message: 'All notifications marked as read'
        }
      });
    } catch (error) {
      logger.error('Error marking all notifications as read', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const studentId = req.body.studentId || '2301430100260';

      const deleted = await notificationService.deleteNotification(id, studentId);

      if (!deleted) {
        logger.warn('Notification not found for deletion', {
          requestId: req.requestId,
          notificationId: id
        });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found',
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: {
          id,
          message: 'Notification deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Error deleting notification', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  async getStats(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const studentId = req.query.studentId as string || '2301430100260';

      const stats = await notificationService.getNotificationStats(studentId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching notification statistics', error, { requestId: req.requestId });
      next(error);
    }
  }

  /**
   * Get filtered notifications
   * POST /api/notifications/filter
   */
  async getFiltered(req: RequestWithId, res: Response, next: NextFunction) {
    try {
      const studentId = req.body.studentId || '2301430100260';
      const page = req.body.page || 1;
      const limit = req.body.limit || 20;
      const filters = req.body.filters as NotificationFilters || {};

      const { notifications, pagination } = await notificationService.getFilteredNotifications(
        studentId,
        filters,
        page,
        limit
      );

      res.json({
        success: true,
        data: {
          notifications,
          pagination
        }
      });
    } catch (error) {
      logger.error('Error fetching filtered notifications', error, { requestId: req.requestId });
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
