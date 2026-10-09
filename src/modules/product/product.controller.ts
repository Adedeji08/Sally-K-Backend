import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as productService from "./product.service.js";
import { listProductsQuerySchema, productFiltersQuerySchema } from "./product.validation.js";
import type { CreateProductInput, UpdateProductInput } from "./product.validation.js";

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.user!.sub, req.body as CreateProductInput);
  sendSuccess(res, { statusCode: 201, message: "Product created successfully", data: product });
});

export const listMyProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.listMyProducts(req.user!.sub);
  sendSuccess(res, { message: "Products fetched successfully", data: products });
});

export const getMyProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getMyProduct(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Product fetched successfully", data: product });
});

export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.user!.sub, req.params.id as string, req.body as UpdateProductInput);
  sendSuccess(res, { message: "Product updated successfully", data: product });
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.user!.sub, req.params.id as string);
  sendSuccess(res, { message: "Product deleted successfully" });
});

// Parsed here rather than via validate(): Express 5 makes req.query read-only.
export const listPublicProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const products = await productService.listPublicProducts(query);
  sendSuccess(res, { message: "Products fetched successfully", data: products });
});

export const getPublicProductFiltersHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = productFiltersQuerySchema.parse(req.query);
  const filters = await productService.getPublicProductFilters(query);
  sendSuccess(res, { message: "Product filters fetched successfully", data: filters });
});

export const getPublicProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getPublicProduct(req.params.id as string);
  sendSuccess(res, { message: "Product fetched successfully", data: product });
});
