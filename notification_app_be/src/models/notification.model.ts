export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: string;
}
