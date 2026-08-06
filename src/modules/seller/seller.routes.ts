import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { storeSetupSchema, verificationSchema } from "./seller.validation.js";
import { onboardingStatusHandler, setupStoreHandler, submitVerificationHandler } from "./seller.controller.js";

const router = Router();

router.use(authenticate, authorize(Role.SELLER));

router.post("/onboarding/store", validate(storeSetupSchema), setupStoreHandler);
router.post("/onboarding/verification", validate(verificationSchema), submitVerificationHandler);
router.get("/onboarding/status", onboardingStatusHandler);

export default router;
