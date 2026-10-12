import { z } from "zod";

const quantitySchema = z.coerce
  .number({ error: "Quantity is required" })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1");

export const addToCartSchema = z.object({
  productId: z.string({ error: "Product id is required" }).uuid("Invalid product id"),
  size: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
