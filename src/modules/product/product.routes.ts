import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { createProductSchema, updateProductSchema } from "./product.validation.js";
import {
  createProductHandler,
  deleteProductHandler,
  getMyProductHandler,
  getPublicProductFiltersHandler,
  getPublicProductHandler,
  listMyProductsHandler,
  listPublicProductsHandler,
  updateProductHandler,
} from "./product.controller.js";

const router = Router();

// Seller-managed products (requires store setup, not KYC verification — that gate comes later).
// Registered before the public "/:id" route so "/mine" and "/mine/:id" resolve as literal paths, not a product id.
router.get("/mine", authenticate, authorize(Role.SELLER), listMyProductsHandler);
router.get("/mine/:id", authenticate, authorize(Role.SELLER), getMyProductHandler);
router.post("/", authenticate, authorize(Role.SELLER), validate(createProductSchema), createProductHandler);
router.patch("/:id", authenticate, authorize(Role.SELLER), validate(updateProductSchema), updateProductHandler);
router.delete("/:id", authenticate, authorize(Role.SELLER), deleteProductHandler);

// Public storefront browsing
router.get("/", listPublicProductsHandler);
router.get("/filters", getPublicProductFiltersHandler);
router.get("/:id", getPublicProductHandler);

export default router;
