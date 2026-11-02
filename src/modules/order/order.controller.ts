import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as orderService from "./order.service.js";
import { listOrdersQuerySchema } from "./order.validation.js";
import type { UpdateOrderStatusInput } from "./order.validation.js";

export const checkoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.createOrdersFromCart(req.user!.sub);
  sendSuccess(res, { statusCode: 201, message: "Order placed successfully", data: orders });
});

// Parsed here rather than via validate(): Express 5 makes req.query read-only.
export const listMyOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const orders = await orderService.listMyOrders(req.user!.sub, query);
  sendSuccess(res, { message: "Orders fetched successfully", data: orders });
});

export const getMyOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getMyOrder(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Order fetched successfully", data: order });
});

export const listReceivedOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const orders = await orderService.listReceivedOrders(req.user!.sub, query);
  sendSuccess(res, { message: "Orders fetched successfully", data: orders });
});

export const getReceivedOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getReceivedOrder(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Order fetched successfully", data: order });
});

export const updateOrderStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateOrderStatus(req.user!.sub, req.params.id as string, req.body as UpdateOrderStatusInput);
  sendSuccess(res, { message: "Order updated successfully", data: order });
});
