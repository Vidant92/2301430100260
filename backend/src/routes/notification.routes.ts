// src/routes/notification.routes.ts
import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { NotificationType } from '../models/notification.model';

const router = Router();

// GET /api/notifications - Get all notifications with pagination
router.get('/', notificationController.getNotifications.bind(notificationController));

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', notificationController.getStats.bind(notificationController));

// POST /api/notifications/filter - Get filtered notifications
router.post(
  '/filter',
  notificationController.getFiltered.bind(notificationController)
);

// POST /api/notifications - Create notification
router.post(
  '/',
  validateRequest([
    { field: 'studentId', required: true, type: 'string' },
    { field: 'title', required: true, type: 'string', maxLength: 255 },
    { field: 'message', required: true, type: 'string' },
    { field: 'type', required: true, type: 'string' }
  ]),
  notificationController.createNotification.bind(notificationController)
);

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', notificationController.getNotificationById.bind(notificationController));

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch(
  '/:id/read',
  notificationController.markAsRead.bind(notificationController)
);

// PATCH /api/notifications/read-all - Mark all as read
router.patch(
  '/read-all',
  notificationController.markAllAsRead.bind(notificationController)
);

// DELETE /api/notifications/:id - Delete notification
router.delete(
  '/:id',
  notificationController.deleteNotification.bind(notificationController)
);

export default router;
