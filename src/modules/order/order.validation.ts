import { z } from "zod";

export const orderStatusSchema = z.enum(["PENDING", "FULFILLED", "CANCELLED"]);

export const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["FULFILLED", "CANCELLED"], { error: "Status must be either FULFILLED or CANCELLED" }),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
