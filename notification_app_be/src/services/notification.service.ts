import { notificationRepository } from "../repositories/notification.repository";
import { Notification, CreateNotificationDto } from "../models/notification.model";
import { Log } from "../utils/logger";

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    try {
      const notifications = notificationRepository.findAll();
      await Log("backend", "info", "service", `Fetched ${notifications.length} notifications`);
      return notifications;
    } catch (err) {
      await Log("backend", "fatal", "service", `Unexpected error in getAll: ${(err as Error).message}`);
      throw err;
    }
  },

  async getById(id: string): Promise<Notification | null> {
    try {
      const notification = notificationRepository.findById(id);
      if (!notification) {
        await Log("backend", "warn", "service", `Notification not found: ${id}`);
        return null;
      }
      await Log("backend", "info", "service", `Notification found: ${id}`);
      return notification;
    } catch (err) {
      await Log("backend", "fatal", "service", `Unexpected error in getById: ${(err as Error).message}`);
      throw err;
    }
  },

  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = notificationRepository.create(dto);
      await Log("backend", "info", "service", `Notification created with id: ${notification.id}`);
      return notification;
    } catch (err) {
      await Log("backend", "fatal", "service", `Unexpected runtime exception in create: ${(err as Error).message}`);
      throw err;
    }
  },

  async deleteById(id: string): Promise<boolean> {
    try {
      const deleted = notificationRepository.deleteById(id);
      if (!deleted) {
        await Log("backend", "warn", "service", `Notification not found for deletion: ${id}`);
        return false;
      }
      await Log("backend", "info", "service", `Notification deleted: ${id}`);
      return true;
    } catch (err) {
      await Log("backend", "fatal", "service", `Unexpected error in deleteById: ${(err as Error).message}`);
      throw err;
    }
  },
};
