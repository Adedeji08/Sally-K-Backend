import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as loyaltyService from "./loyalty.service.js";

export const getRewardsHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await loyaltyService.getRewardsSummary(req.user!.sub);
  sendSuccess(res, { message: "Rewards fetched successfully", data: summary });
});
