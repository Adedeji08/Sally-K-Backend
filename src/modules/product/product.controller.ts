import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as productService from "./product.service.js";
import type { CreateProductInput, UpdateProductInput } from "./product.validation.js";

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.user!.sub, req.body as CreateProductInput);
  sendSuccess(res, { statusCode: 201, message: "Product created successfully", data: product });
});

export const listMyProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.listMyProducts(req.user!.sub);
  sendSuccess(res, { message: "Products fetched successfully", data: products });
});

export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.user!.sub, req.params.id as string, req.body as UpdateProductInput);
  sendSuccess(res, { message: "Product updated successfully", data: product });
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Product deleted successfully" });
});

export const listPublicProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const products = await productService.listPublicProducts(category);
  sendSuccess(res, { message: "Products fetched successfully", data: products });
});

export const getPublicProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getPublicProduct(req.params.id as string);
  sendSuccess(res, { message: "Product fetched successfully", data: product });
});
