// src/models/notification.model.ts
export enum NotificationType {
  PLACEMENT = 'PLACEMENT',
  RESULT = 'RESULT',
  EVENT = 'EVENT'
}

export enum NotificationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export interface Notification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isDeleted?: boolean;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationRequest {
  studentId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  details?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType[];
  isRead?: boolean;
  priority?: number[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    requestId: string;
    timestamp: string;
  };
}
