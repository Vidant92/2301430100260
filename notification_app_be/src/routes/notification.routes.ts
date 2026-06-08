import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { validateCreateNotification } from "../middleware/validation.middleware";

const router = Router();

router.get("/", notificationController.getAll);
router.get("/:id", notificationController.getById);
router.post("/", validateCreateNotification, notificationController.create);
router.delete("/:id", notificationController.deleteById);

export default router;
