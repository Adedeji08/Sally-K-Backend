import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as cartService from "./cart.service.js";
import type { AddToCartInput, UpdateCartItemInput } from "./cart.validation.js";

export const addToCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await cartService.addToCart(req.user!.sub, req.body as AddToCartInput);
  sendSuccess(res, { statusCode: 201, message: "Added to cart", data: item });
});

export const listCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.listCart(req.user!.sub);
  sendSuccess(res, { message: "Cart fetched successfully", data: cart });
});

export const updateCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = await cartService.updateCartItem(req.user!.sub, req.params.id as string, req.body as UpdateCartItemInput);
  sendSuccess(res, { message: "Cart item updated successfully", data: item });
});

export const removeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  await cartService.removeCartItem(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Item removed from cart" });
});
