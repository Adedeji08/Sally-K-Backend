import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { ListOrdersQuery, UpdateOrderStatusInput } from "./order.validation.js";

const ORDER_INCLUDE = {
  items: true,
  seller: { select: { id: true, brandName: true, logoUrl: true, address: true } },
  buyer: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
} as const;

async function requireSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });

  if (!sellerProfile) {
    throw ApiError.badRequest("Set up your storefront before managing orders");
  }

  return sellerProfile;
}

// Checks out the buyer's entire cart: splits it by seller into one Order each
// (so each seller's dashboard only ever sees their own orders), snapshots the
// product details onto each line, decrements stock, and clears the cart —
// all inside one transaction so a mid-checkout failure leaves nothing partial.
export async function createOrdersFromCart(userId: string) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: { id: true, name: true, images: true, price: true, stock: true, isActive: true, sellerId: true } } },
  });

  if (cartItems.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  for (const item of cartItems) {
    if (!item.product.isActive) {
      throw ApiError.badRequest(`"${item.product.name}" is no longer available`);
    }
    if (item.quantity > item.product.stock) {
      throw ApiError.badRequest(`Only ${item.product.stock} left in stock for "${item.product.name}"`);
    }
  }

  const bySeller = new Map<string, typeof cartItems>();
  for (const item of cartItems) {
    const group = bySeller.get(item.product.sellerId) ?? [];
    group.push(item);
    bySeller.set(item.product.sellerId, group);
  }

  const orders = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const [sellerId, items] of bySeller) {
      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const order = await tx.order.create({
        data: {
          buyerId: userId,
          sellerId,
          subtotal,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              image: item.product.images[0] ?? null,
              price: item.product.price,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      created.push(order);
    }

    await tx.cartItem.deleteMany({ where: { userId } });

    return created;
  });

  return orders;
}

export async function listMyOrders(userId: string, query: ListOrdersQuery) {
  return prisma.order.findMany({
    where: { buyerId: userId, ...(query.status && { status: query.status }) },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });

  if (!order || order.buyerId !== userId) {
    throw ApiError.notFound("Order not found");
  }

  return order;
}

export async function listReceivedOrders(userId: string, query: ListOrdersQuery) {
  const sellerProfile = await requireSellerProfile(userId);

  return prisma.order.findMany({
    where: { sellerId: sellerProfile.id, ...(query.status && { status: query.status }) },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

async function findReceivedOrder(userId: string, orderId: string) {
  const sellerProfile = await requireSellerProfile(userId);
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });

  if (!order || order.sellerId !== sellerProfile.id) {
    throw ApiError.notFound("Order not found");
  }

  return order;
}

export async function getReceivedOrder(userId: string, orderId: string) {
  return findReceivedOrder(userId, orderId);
}

export async function updateOrderStatus(userId: string, orderId: string, input: UpdateOrderStatusInput) {
  const order = await findReceivedOrder(userId, orderId);

  if (order.status !== "PENDING") {
    throw ApiError.badRequest(`This order is already ${order.status.toLowerCase()}`);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: input.status },
    include: ORDER_INCLUDE,
  });
}
