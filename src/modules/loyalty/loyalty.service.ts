import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { loyaltyConfig, type LoyaltyTier } from "./loyalty.config.js";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

function tierForOrderCount(orderCount: number): { tier: LoyaltyTier; nextTier: { tier: LoyaltyTier; ordersNeeded: number } | null } {
  const tiers = loyaltyConfig.TIERS; // highest minOrders first
  const current = tiers.find((t) => orderCount >= t.minOrders)!;
  const currentIndex = tiers.indexOf(current);
  const next = currentIndex > 0 ? tiers[currentIndex - 1] : null;

  return {
    tier: current.tier,
    nextTier: next ? { tier: next.tier, ordersNeeded: next.minOrders - orderCount } : null,
  };
}

async function getOrderCountLast12Months(userId: string) {
  return prisma.order.count({
    where: {
      buyerId: userId,
      status: "FULFILLED",
      createdAt: { gte: new Date(Date.now() - TWELVE_MONTHS_MS) },
    },
  });
}

async function getAvailablePoints(userId: string) {
  const result = await prisma.loyaltyTransaction.aggregate({
    where: { userId, status: "ACTIVE" },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

async function getPendingPoints(userId: string) {
  const result = await prisma.loyaltyTransaction.aggregate({
    where: { userId, type: "EARN", status: "PENDING" },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

// Last fully-completed calendar month's GMV from fulfilled orders — used as
// the reference for the monthly redemption cap. Deliberately the *previous*
// month, not the current one, so the cap isn't an ever-shifting target that
// starts at ~0 on the 1st of every month.
async function getPreviousMonthGMV() {
  const now = new Date();
  const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const result = await prisma.order.aggregate({
    where: { status: "FULFILLED", createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
    _sum: { subtotal: true },
  });
  return result._sum.subtotal ?? 0;
}

async function getPointsRedeemedValueThisMonth() {
  const now = new Date();
  const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const payments = await prisma.payment.aggregate({
    where: { status: "PAID", paidAt: { gte: startOfThisMonth }, pointsRedeemed: { gt: 0 } },
    _sum: { pointsDiscount: true },
  });
  return payments._sum.pointsDiscount ?? 0;
}

export async function getRewardsSummary(userId: string) {
  const [available, pending, orderCount] = await Promise.all([
    getAvailablePoints(userId),
    getPendingPoints(userId),
    getOrderCountLast12Months(userId),
  ]);

  const { tier, nextTier } = tierForOrderCount(orderCount);

  const history = await prisma.loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    tier,
    ordersLast12Months: orderCount,
    nextTier,
    points: { available, pending },
    redemption: {
      ratePerPoint: loyaltyConfig.REDEEM_VALUE,
      minPoints: loyaltyConfig.MIN_REDEEM_POINTS,
      maxPercentOfOrder: loyaltyConfig.MAX_REDEEM_PCT_OF_ORDER,
    },
    history: history.map((h) => ({
      id: h.id,
      type: h.type,
      status: h.status,
      points: h.points,
      description: h.description,
      orderId: h.orderId,
      availableAt: h.availableAt,
      createdAt: h.createdAt,
    })),
  };
}

// Called when a seller marks an order fulfilled. Points sit PENDING for
// HOLD_DAYS before they're spendable — see loyalty.config for why.
export async function recordEarnedPoints(userId: string, orderId: string, orderSubtotal: number) {
  const points = Math.round(orderSubtotal * loyaltyConfig.EARN_RATE);
  if (points <= 0) return;

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      orderId,
      type: "EARN",
      status: "PENDING",
      points,
      description: `Earned from order`,
      availableAt: new Date(Date.now() + loyaltyConfig.HOLD_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

// Validates a buyer's requested point redemption against their balance and
// every safety cap, and returns the ₦ discount it's worth. Called at
// checkout (payment initialize), before any charge is made.
export async function priceRedemption(userId: string, pointsToRedeem: number, orderTotal: number): Promise<number> {
  if (pointsToRedeem <= 0) return 0;

  if (pointsToRedeem < loyaltyConfig.MIN_REDEEM_POINTS) {
    throw ApiError.badRequest(`You need at least ${loyaltyConfig.MIN_REDEEM_POINTS} points to redeem`);
  }

  const available = await getAvailablePoints(userId);
  if (pointsToRedeem > available) {
    throw ApiError.badRequest(`You only have ${available} points available`);
  }

  const discount = pointsToRedeem * loyaltyConfig.REDEEM_VALUE;
  const maxDiscount = orderTotal * loyaltyConfig.MAX_REDEEM_PCT_OF_ORDER;
  if (discount > maxDiscount) {
    throw ApiError.badRequest(
      `Points can cover at most ${Math.round(loyaltyConfig.MAX_REDEEM_PCT_OF_ORDER * 100)}% of this order (₦${maxDiscount.toFixed(2)})`
    );
  }

  const [previousMonthGMV, redeemedThisMonth] = await Promise.all([getPreviousMonthGMV(), getPointsRedeemedValueThisMonth()]);
  const monthlyCap = previousMonthGMV * loyaltyConfig.MONTHLY_REDEMPTION_CAP_PCT_OF_GMV;
  if (redeemedThisMonth + discount > monthlyCap) {
    throw ApiError.badRequest("Points redemption has hit this month's limit — please try again next month or pay the full amount");
  }

  return discount;
}

// Called once a payment that redeemed points is confirmed PAID.
export async function recordRedemption(userId: string, paymentId: string, points: number, discount: number) {
  if (points <= 0) return;

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "REDEEM",
      status: "ACTIVE",
      points: -points,
      description: `Redeemed for ₦${discount.toFixed(2)} off an order`,
    },
  });
}

// Run on a schedule (see server.ts) — flips matured PENDING earnings to
// ACTIVE so they become spendable.
export async function activateMaturedPoints() {
  const result = await prisma.loyaltyTransaction.updateMany({
    where: { type: "EARN", status: "PENDING", availableAt: { lte: new Date() } },
    data: { status: "ACTIVE" },
  });
  return result.count;
}
