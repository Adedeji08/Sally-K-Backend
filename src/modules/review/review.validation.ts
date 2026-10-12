import { z } from "zod";

const ratingSchema = z.coerce
  .number({ error: "Rating is required" })
  .int("Rating must be a whole number")
  .min(1, "Rating must be between 1 and 5")
  .max(5, "Rating must be between 1 and 5");

const commentSchema = z
  .string({ error: "Review comment is required" })
  .trim()
  .min(5, "Tell other shoppers a bit more (min 5 characters)")
  .max(1000, "Review must be at most 1000 characters");

export const createReviewSchema = z.object({
  productId: z.string({ error: "Product id is required" }).uuid("Invalid product id"),
  rating: ratingSchema,
  comment: commentSchema,
});

export const updateReviewSchema = z.object({
  rating: ratingSchema.optional(),
  comment: commentSchema.optional(),
});

export const listReviewsQuerySchema = z.object({
  productId: z.string({ error: "Product id is required" }).uuid("Invalid product id"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
