import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as sellerService from "./seller.service.js";
import type { StoreSetupInput, VerificationInput } from "./seller.validation.js";

export const setupStoreHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await sellerService.setupStore(req.user!.sub, req.body as StoreSetupInput);
  sendSuccess(res, { statusCode: 201, message: "Storefront created successfully", data: profile });
});

export const submitVerificationHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await sellerService.submitVerification(req.user!.sub, req.body as VerificationInput);
  sendSuccess(res, { message: "Verification submitted successfully, we'll review it shortly", data: profile });
});

export const onboardingStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await sellerService.getOnboardingStatus(req.user!.sub);
  sendSuccess(res, { message: "Onboarding status fetched successfully", data: profile });
});
