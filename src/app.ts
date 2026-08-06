import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import sellerRoutes from "./modules/seller/seller.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: true, message: "Server is healthy", data: { uptime: process.uptime() } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sellers", sellerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
