import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as authService from "./auth.service.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "./auth.validation.js";

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body as SignupInput);
  sendSuccess(res, { statusCode: 201, message: "Account created successfully", data: result });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  sendSuccess(res, { message: "Login successful", data: result });
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body as ForgotPasswordInput);
  sendSuccess(res, { message: "If an account exists for this email, a reset link has been sent" });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body as ResetPasswordInput);
  sendSuccess(res, { message: "Password reset successfully" });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.sub);
  sendSuccess(res, { message: "User fetched successfully", data: result });
});

export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body as VerifyEmailInput);
  sendSuccess(res, { message: "Email verified successfully", data: result });
});

export const resendVerificationHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerification(req.body as ResendVerificationInput);
  sendSuccess(res, { message: "If an account exists for this email, a new verification code has been sent" });
});
