// Every rate the rewards program runs on, in one place and env-overridable —
// so the business can retune or pause redemption without a code deploy.
// See the design discussion this implements: fund rewards from a small,
// capped share of GMV (there is no per-order platform fee today — sellers
// keep 100%, monetization is a future seller subscription), never from cash
// the business doesn't have yet.

function numberFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const loyaltyConfig = {
  // Points earned per ₦1 of order subtotal. Kept high (matches the
  // storefront's existing "10 points per ₦1" copy) — this is a display
  // number, not the real cost; REDEEM_VALUE below controls the real cost.
  EARN_RATE: numberFromEnv("LOYALTY_EARN_RATE", 10),

  // ₦ value of one point when redeemed. 0.002 means 10,000 points (from a
  // ₦1,000 order) are worth ₦20 later — roughly a 2% effective cashback.
  REDEEM_VALUE: numberFromEnv("LOYALTY_REDEEM_VALUE", 0.002),

  // Days after an order is marked fulfilled before its points become
  // spendable. Protects against disputes/chargebacks landing after the
  // order was already marked fulfilled.
  HOLD_DAYS: numberFromEnv("LOYALTY_HOLD_DAYS", 7),

  // Can't redeem fewer than this many points at once.
  MIN_REDEEM_POINTS: numberFromEnv("LOYALTY_MIN_REDEEM_POINTS", 1000),

  // A single order's points discount can't exceed this fraction of its
  // subtotal — sellers are never shorted their full order value.
  MAX_REDEEM_PCT_OF_ORDER: numberFromEnv("LOYALTY_MAX_REDEEM_PCT_OF_ORDER", 0.1),

  // Total ₦ value of points redeemed across all buyers in a calendar month
  // can't exceed this fraction of *last* month's GMV from fulfilled orders.
  // In a month with no prior fulfilled GMV (e.g. the business's first month)
  // this cap is 0 — redemption is simply unavailable until there's a track
  // record of real sales to size it against. That's intentional.
  MONTHLY_REDEMPTION_CAP_PCT_OF_GMV: numberFromEnv("LOYALTY_MONTHLY_CAP_PCT_OF_GMV", 0.01),

  // Tier thresholds: fulfilled orders in the trailing 12 months. Tier can
  // decay if a buyer goes quiet for a year — deliberate, matches how airline
  // status works, flagged so it isn't a silent surprise.
  TIERS: [
    { tier: "PLATINUM", minOrders: 30 },
    { tier: "GOLD", minOrders: 15 },
    { tier: "SILVER", minOrders: 5 },
    { tier: "BRONZE", minOrders: 0 },
  ] as const,
};

export type LoyaltyTier = (typeof loyaltyConfig.TIERS)[number]["tier"];
