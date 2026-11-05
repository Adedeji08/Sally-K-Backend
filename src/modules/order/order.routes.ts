import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { updateOrderStatusSchema } from "./order.validation.js";
import {
  getMyOrderHandler,
  getReceivedOrderHandler,
  listMyOrdersHandler,
  listReceivedOrdersHandler,
  updateOrderStatusHandler,
} from "./order.controller.js";

const router = Router();

router.use(authenticate);

// Buyer-side: view own orders. Orders are created by paying via
// POST /api/v1/payments/initialize + GET /api/v1/payments/verify/:reference,
// not directly here — see the payment module.
router.get("/mine", listMyOrdersHandler);
router.get("/mine/:id", getMyOrderHandler);

// Seller-side: orders received on their storefront.
router.get("/received", authorize(Role.SELLER), listReceivedOrdersHandler);
router.get("/received/:id", authorize(Role.SELLER), getReceivedOrderHandler);
router.patch("/received/:id", authorize(Role.SELLER), validate(updateOrderStatusSchema), updateOrderStatusHandler);

export default router;
