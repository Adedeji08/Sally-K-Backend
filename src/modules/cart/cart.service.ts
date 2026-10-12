import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { AddToCartInput, UpdateCartItemInput } from "./cart.validation.js";

const CART_PRODUCT_SELECT = {
  product: { select: { name: true, price: true, images: true, stock: true, isActive: true } },
} as const;

export async function addToCart(userId: string, input: AddToCartInput) {
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const size = input.size ?? "";
  const color = input.color ?? "";

  if (product.sizes.length && !size) {
    throw ApiError.badRequest("Select a size for this product");
  }
  if (size && product.sizes.length && !product.sizes.includes(size)) {
    throw ApiError.badRequest("Selected size is not available for this product");
  }
  if (product.colors.length && !color) {
    throw ApiError.badRequest("Select a color for this product");
  }
  if (color && product.colors.length && !product.colors.includes(color)) {
    throw ApiError.badRequest("Selected color is not available for this product");
  }

  const key = { userId, productId: input.productId, size, color };
  const existing = await prisma.cartItem.findUnique({ where: { userId_productId_size_color: key } });

  const quantity = (existing?.quantity ?? 0) + input.quantity;
  if (quantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} left in stock`);
  }

  return prisma.cartItem.upsert({
    where: { userId_productId_size_color: key },
    create: { ...key, quantity: input.quantity },
    update: { quantity },
    include: CART_PRODUCT_SELECT,
  });
}

export async function listCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: CART_PRODUCT_SELECT,
    orderBy: { createdAt: "desc" },
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, itemCount };
}

async function findOwnedCartItem(userId: string, cartItemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: { select: { stock: true } } },
  });

  if (!item || item.userId !== userId) {
    throw ApiError.notFound("Cart item not found");
  }

  return item;
}

export async function updateCartItem(userId: string, cartItemId: string, input: UpdateCartItemInput) {
  const item = await findOwnedCartItem(userId, cartItemId);

  if (input.quantity > item.product.stock) {
    throw ApiError.badRequest(`Only ${item.product.stock} left in stock`);
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: input.quantity },
    include: CART_PRODUCT_SELECT,
  });
}

export async function removeCartItem(userId: string, cartItemId: string) {
  await findOwnedCartItem(userId, cartItemId);
  await prisma.cartItem.delete({ where: { id: cartItemId } });
}
