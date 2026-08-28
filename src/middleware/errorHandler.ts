import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "value";
      if (!errors[key]) errors[key] = issue.message;
    }
    return res.status(422).json({
      status: false,
      message: "Validation failed",
      errors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
    return res.status(409).json({
      status: false,
      message: `A record with this ${target} already exists`,
    });
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ status: false, message: "Session expired, please log in again" });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ status: false, message: "Invalid or malformed token" });
  }

  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 10MB)" : err.message;
    return res.status(400).json({ status: false, message });
  }

  console.error(err);

  return res.status(500).json({
    status: false,
    message: env.NODE_ENV === "production" ? "Something went wrong" : (err as Error)?.message || "Internal server error",
  });
}
