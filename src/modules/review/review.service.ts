import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateReviewInput, UpdateReviewInput } from "./review.validation.js";

const REVIEWER_SELECT = { user: { select: { fullName: true } } } as const;

export async function getProductRatingSummary(productId: string) {
  const summary = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });

  return {
    average: summary._avg.rating ? Math.round(summary._avg.rating * 10) / 10 : 0,
    count: summary._count,
  };
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: input.productId, userId } },
  });
  if (existing) {
    throw ApiError.conflict("You already reviewed this product. Edit your existing review instead.");
  }

  return prisma.review.create({
    data: {
      productId: input.productId,
      userId,
      rating: input.rating,
      comment: input.comment,
    },
    include: REVIEWER_SELECT,
  });
}

export async function listReviews(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: REVIEWER_SELECT,
      orderBy: { createdAt: "desc" },
    }),
    getProductRatingSummary(productId),
  ]);

  return { reviews, summary };
}

async function findOwnedReview(userId: string, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review || review.userId !== userId) {
    throw ApiError.notFound("Review not found");
  }

  return review;
}

export async function updateReview(userId: string, reviewId: string, input: UpdateReviewInput) {
  await findOwnedReview(userId, reviewId);

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.comment !== undefined && { comment: input.comment }),
    },
    include: REVIEWER_SELECT,
  });
}

export async function deleteReview(userId: string, reviewId: string) {
  await findOwnedReview(userId, reviewId);
  await prisma.review.delete({ where: { id: reviewId } });
}
