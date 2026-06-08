import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  logApiUrl: process.env.LOG_API_URL || "",
  accessToken: process.env.ACCESS_TOKEN || "",
};
