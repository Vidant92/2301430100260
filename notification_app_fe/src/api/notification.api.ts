import apiClient from "./axiosClient";
import { Log } from "../utils/logger";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: string;
}

export const notificationApi = {
  async getAll(): Promise<Notification[]> {
    try {
      const response = await apiClient.get<Notification[]>("/notifications");
      await Log("frontend", "info", "api", "Fetched all notifications successfully");
      return response.data;
    } catch (err) {
      await Log("frontend", "error", "api", "failed to fetch notifications");
      throw err;
    }
  },

  async getById(id: string): Promise<Notification> {
    try {
      const response = await apiClient.get<Notification>(`/notifications/${id}`);
      await Log("frontend", "info", "api", `Fetched notification: ${id}`);
      return response.data;
    } catch (err) {
      await Log("frontend", "error", "api", `Failed to fetch notification: ${id}`);
      throw err;
    }
  },

  async create(payload: CreateNotificationPayload): Promise<Notification> {
    try {
      const response = await apiClient.post<{ success: boolean; notification: Notification }>(
        "/notifications",
        payload
      );
      await Log("frontend", "info", "api", "Notification created successfully");
      return response.data.notification;
    } catch (err) {
      await Log("frontend", "error", "api", "Failed to create notification");
      throw err;
    }
  },

  async deleteById(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
      await Log("frontend", "info", "api", `Notification deleted: ${id}`);
    } catch (err) {
      await Log("frontend", "error", "api", `Failed to delete notification: ${id}`);
      throw err;
    }
  },
};
