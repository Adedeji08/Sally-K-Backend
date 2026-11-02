import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { updateOrderStatusSchema } from "./order.validation.js";
import {
  checkoutHandler,
  getMyOrderHandler,
  getReceivedOrderHandler,
  listMyOrdersHandler,
  listReceivedOrdersHandler,
  updateOrderStatusHandler,
} from "./order.controller.js";

const router = Router();

router.use(authenticate);

// Buyer-side: place an order from the current cart, view own orders.
router.post("/", checkoutHandler);
router.get("/mine", listMyOrdersHandler);
router.get("/mine/:id", getMyOrderHandler);

// Seller-side: orders received on their storefront.
router.get("/received", authorize(Role.SELLER), listReceivedOrdersHandler);
router.get("/received/:id", authorize(Role.SELLER), getReceivedOrderHandler);
router.patch("/received/:id", authorize(Role.SELLER), validate(updateOrderStatusSchema), updateOrderStatusHandler);

export default router;
