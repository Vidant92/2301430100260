import { v4 as uuidv4 } from "uuid";
import { Notification, CreateNotificationDto } from "../models/notification.model";

// In-memory store
const notifications: Notification[] = [];

export const notificationRepository = {
  findAll(): Notification[] {
    return [...notifications];
  },

  findById(id: string): Notification | undefined {
    return notifications.find((n) => n.id === id);
  },

  create(dto: CreateNotificationDto): Notification {
    const newNotification: Notification = {
      id: uuidv4(),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      createdAt: new Date(),
    };
    notifications.push(newNotification);
    return newNotification;
  },

  deleteById(id: string): boolean {
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;
    notifications.splice(index, 1);
    return true;
  },
};
