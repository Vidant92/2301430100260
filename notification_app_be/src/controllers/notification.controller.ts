import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { Log } from "../utils/logger";

export const notificationController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Log("backend", "info", "controller", "GET /notifications called");
      const notifications = await notificationService.getAll();
      res.status(200).json(notifications);
    } catch (err) {
      await Log("backend", "error", "controller", `GET /notifications failed: ${(err as Error).message}`);
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Log("backend", "info", "controller", `GET /notifications/${id} called`);
      const notification = await notificationService.getById(id);
      if (!notification) {
        await Log("backend", "warn", "controller", `Notification not found: ${id}`);
        res.status(404).json({ success: false, message: "Notification not found" });
        return;
      }
      res.status(200).json(notification);
    } catch (err) {
      await Log("backend", "error", "controller", `GET /notifications/:id failed: ${(err as Error).message}`);
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Log("backend", "info", "controller", "POST /notifications called");
      const { title, message, type } = req.body;
      const notification = await notificationService.create({ title, message, type });
      await Log("backend", "info", "controller", `Notification created: ${notification.id}`);
      res.status(201).json({ success: true, notification });
    } catch (err) {
      await Log("backend", "error", "controller", `POST /notifications failed: ${(err as Error).message}`);
      next(err);
    }
  },

  async deleteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Log("backend", "info", "controller", `DELETE /notifications/${id} called`);
      const deleted = await notificationService.deleteById(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Notification not found" });
        return;
      }
      res.status(200).json({ success: true });
    } catch (err) {
      await Log("backend", "error", "controller", `DELETE /notifications/:id failed: ${(err as Error).message}`);
      next(err);
    }
  },
};
