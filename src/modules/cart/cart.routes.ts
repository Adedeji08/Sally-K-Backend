import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { addToCartSchema, updateCartItemSchema } from "./cart.validation.js";
import { addToCartHandler, listCartHandler, removeCartItemHandler, updateCartItemHandler } from "./cart.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listCartHandler);
router.post("/", validate(addToCartSchema), addToCartHandler);
router.patch("/:id", validate(updateCartItemSchema), updateCartItemHandler);
router.delete("/:id", removeCartItemHandler);

export default router;
