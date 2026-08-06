import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.validation.js";
import {
  forgotPasswordHandler,
  loginHandler,
  meHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  signupHandler,
  verifyEmailHandler,
} from "./auth.controller.js";

const router = Router();

router.post("/signup", validate(signupSchema), signupHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordHandler);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmailHandler);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerificationHandler);
router.get("/me", authenticate, meHandler);

export default router;
