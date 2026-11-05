import type { Request, Response } from "express";
import crypto from "node:crypto";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import * as paymentService from "./payment.service.js";

export const getPublicConfigHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { message: "Payment config fetched successfully", data: paymentService.getPublicConfig() });
});

export const initializePaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.initializePayment(req.user!.sub, req.user!.email);
  sendSuccess(res, { statusCode: 201, message: "Payment initialized successfully", data: result });
});

export const verifyPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.verifyPayment(req.user!.sub, req.params.reference as string);
  sendSuccess(res, { message: "Payment verified successfully", data: result });
});

// Public endpoint — Paystack calls this server-to-server. Trust nothing
// without a valid signature, computed over the raw request bytes (see
// express.json's verify hook in app.ts) since a re-serialized body would not
// byte-match what Paystack signed.
export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-paystack-signature"];

  if (typeof signature !== "string" || !req.rawBody) {
    throw ApiError.unauthorized("Missing Paystack signature");
  }

  const expected = crypto.createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(req.rawBody).digest("hex");

  if (expected !== signature) {
    throw ApiError.unauthorized("Invalid Paystack signature");
  }

  const event = req.body as { event?: string; data?: { reference?: string } };

  if (event.event === "charge.success" && event.data?.reference) {
    await paymentService.handleChargeSuccessWebhook(event.data.reference);
  }

  res.status(200).json({ received: true });
});
