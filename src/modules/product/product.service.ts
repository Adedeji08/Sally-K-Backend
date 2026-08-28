import { SellerCategory } from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateProductInput, UpdateProductInput } from "./product.validation.js";

const CATEGORY_MAP: Record<CreateProductInput["category"], SellerCategory> = {
  dresses: SellerCategory.DRESSES,
  tops: SellerCategory.TOPS,
  men: SellerCategory.MEN,
  shoes: SellerCategory.SHOES,
  bags: SellerCategory.BAGS,
  accessories: SellerCategory.ACCESSORIES,
  mixed: SellerCategory.MIXED,
};

async function requireSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });

  if (!sellerProfile) {
    throw ApiError.badRequest("Set up your storefront before adding products");
  }

  return sellerProfile;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const sellerProfile = await requireSellerProfile(userId);

  return prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      name: input.name,
      description: input.description,
      price: input.price,
      category: CATEGORY_MAP[input.category],
      images: input.images,
      sizes: input.sizes,
      stock: input.stock,
    },
  });
}

export async function listMyProducts(userId: string) {
  const sellerProfile = await requireSellerProfile(userId);

  return prisma.product.findMany({
    where: { sellerId: sellerProfile.id },
    orderBy: { createdAt: "desc" },
  });
}

async function findOwnedProduct(userId: string, productId: string) {
  const sellerProfile = await requireSellerProfile(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || product.sellerId !== sellerProfile.id) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  await findOwnedProduct(userId, productId);

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.category !== undefined && { category: CATEGORY_MAP[input.category] }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.sizes !== undefined && { sizes: input.sizes }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteProduct(userId: string, productId: string) {
  await findOwnedProduct(userId, productId);
  await prisma.product.delete({ where: { id: productId } });
}

function isValidCategoryFilter(value: string): value is CreateProductInput["category"] {
  return value in CATEGORY_MAP;
}

export async function listPublicProducts(category?: string) {
  const mappedCategory = category && isValidCategoryFilter(category) ? CATEGORY_MAP[category] : undefined;

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(mappedCategory ? { category: mappedCategory } : {}),
    },
    include: { seller: { select: { brandName: true, verificationStatus: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublicProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { seller: { select: { brandName: true, verificationStatus: true } } },
  });

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}
