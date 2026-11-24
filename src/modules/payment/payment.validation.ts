import { z } from "zod";

// Preprocessed so a request sent with no body at all (no Content-Type, no
// bytes — req.body stays `undefined`) still parses as "no points to redeem"
// instead of failing validation.
export const initializePaymentSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    pointsToRedeem: z.coerce.number().int().min(0, "pointsToRedeem cannot be negative").default(0),
  })
);

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
