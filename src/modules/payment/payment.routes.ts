import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
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
router.post("/initialize", authenticate, initializePaymentHandler);
router.get("/verify/:reference", authenticate, verifyPaymentHandler);

export default router;
