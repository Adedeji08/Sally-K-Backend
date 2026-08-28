import { z } from "zod";

const categorySchema = z.enum(["dresses", "tops", "men", "shoes", "bags", "accessories", "mixed"], {
  error: "Select a valid category",
});

const nameSchema = z
  .string({ error: "Product name is required" })
  .trim()
  .min(2, "Product name must be at least 2 characters")
  .max(150, "Product name must be at most 150 characters");

const descriptionSchema = z
  .string({ error: "Product description is required" })
  .trim()
  .min(10, "Tell shoppers a bit more about this product (min 10 characters)")
  .max(2000, "Description must be at most 2000 characters");

const priceSchema = z.coerce.number({ error: "Price is required" }).positive("Price must be greater than 0");

const imagesSchema = z
  .array(z.string({ error: "Each image must be a URL" }).trim().url("Each image must be a valid URL"))
  .min(1, "Add at least one product image")
  .max(8, "You can add up to 8 images");

const sizesSchema = z.array(z.string().trim().min(1));

const stockSchema = z.coerce.number({ error: "Stock quantity is required" }).int().min(0, "Stock cannot be negative");

export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  category: categorySchema,
  images: imagesSchema,
  sizes: sizesSchema.default([]),
  stock: stockSchema,
});

// Built from the same field schemas (without defaults) so omitted fields on a
// partial update stay `undefined` instead of being reset — Zod's `.partial()`
// still applies `.default()` on fields that carry one, which would silently
// wipe them out on update.
export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  category: categorySchema.optional(),
  images: imagesSchema.optional(),
  sizes: sizesSchema.optional(),
  stock: stockSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
