import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as reviewService from "./review.service.js";
import { listReviewsQuerySchema } from "./review.validation.js";
import type { CreateReviewInput, UpdateReviewInput } from "./review.validation.js";

export const createReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.sub, req.body as CreateReviewInput);
  sendSuccess(res, { statusCode: 201, message: "Review added successfully", data: review });
});

// Parsed here rather than via validate(): Express 5 makes req.query read-only.
export const listReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listReviewsQuerySchema.parse(req.query);
  const result = await reviewService.listReviews(query.productId);
  sendSuccess(res, { message: "Reviews fetched successfully", data: result });
});

export const updateReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.updateReview(req.user!.sub, req.params.id as string, req.body as UpdateReviewInput);
  sendSuccess(res, { message: "Review updated successfully", data: review });
});

export const deleteReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Review deleted successfully" });
});
