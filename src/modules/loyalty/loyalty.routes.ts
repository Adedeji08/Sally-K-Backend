import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getRewardsHandler } from "./loyalty.controller.js";

const router = Router();

router.get("/", authenticate, getRewardsHandler);

export default router;
