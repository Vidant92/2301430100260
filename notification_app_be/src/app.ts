import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

// CORS — allow all origins (change in production)
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/notifications", notificationRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
