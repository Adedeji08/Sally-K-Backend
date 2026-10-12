import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { createReviewSchema, updateReviewSchema } from "./review.validation.js";
import {
  createReviewHandler,
  deleteReviewHandler,
  listReviewsHandler,
  updateReviewHandler,
} from "./review.controller.js";

const router = Router();

router.post("/", authenticate, validate(createReviewSchema), createReviewHandler);
router.get("/", listReviewsHandler);
router.patch("/:id", authenticate, validate(updateReviewSchema), updateReviewHandler);
router.delete("/:id", authenticate, deleteReviewHandler);

export default router;
