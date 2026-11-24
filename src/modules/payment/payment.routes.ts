import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { initializePaymentSchema } from "./payment.validation.js";
import {
  getPublicConfigHandler,
  initializePaymentHandler,
  verifyPaymentHandler,
  webhookHandler,
} from "./payment.controller.js";

const router = Router();

// Public: frontend reads the publishable key, Paystack posts webhook events.
router.get("/config", getPublicConfigHandler);
router.post("/webhook", webhookHandler);

// Buyer-side checkout.
router.post("/initialize", authenticate, validate(initializePaymentSchema), initializePaymentHandler);
router.get("/verify/:reference", authenticate, verifyPaymentHandler);

export default router;
