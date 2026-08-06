import type { Response } from "express";

interface SuccessOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
}

export function sendSuccess<T>(res: Response, { statusCode = 200, message, data }: SuccessOptions<T>) {
  return res.status(statusCode).json({
    status: true,
    message,
    data: data ?? null,
  });
}
