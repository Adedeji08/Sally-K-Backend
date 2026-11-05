import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import * as paystack from "../../config/paystack.js";
import * as orderService from "../order/order.service.js";

const DEFAULT_CALLBACK_PATH = "/payment/callback";

const ORDER_INCLUDE = {
  items: true,
  seller: { select: { id: true, brandName: true, logoUrl: true, address: true } },
} as const;

function generateReference() {
  return `sallyk_${randomUUID().replace(/-/g, "")}`;
}

export async function initializePayment(userId: string, email: string) {
  const total = await orderService.getCheckoutTotal(userId);
  const reference = generateReference();
  const callbackUrl = env.PAYSTACK_CALLBACK_URL ?? `${env.CORS_ORIGIN}${DEFAULT_CALLBACK_PATH}`;

  const result = await paystack.initializeTransaction({
    email,
    amountKobo: Math.round(total * 100),
    reference,
    callbackUrl,
  });

  if (!result.status) {
    throw ApiError.badRequest(result.message || "Could not start payment with Paystack");
  }

  const payment = await prisma.payment.create({
    data: {
      buyerId: userId,
      reference,
      amount: total,
      accessCode: result.data.access_code,
      authorizationUrl: result.data.authorization_url,
    },
  });

  return {
    reference: payment.reference,
    amount: payment.amount,
    authorizationUrl: payment.authorizationUrl,
    accessCode: payment.accessCode,
  };
}

// Shared by the buyer-triggered verify endpoint and the Paystack webhook.
// Idempotent: calling it again for an already-PAID payment just returns the
// orders already created, rather than re-charging or re-creating anything.
async function confirmPayment(reference: string) {
  const payment = await prisma.payment.findUnique({ where: { reference } });

  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  if (payment.status === "PAID") {
    const orders = await prisma.order.findMany({ where: { paymentId: payment.id }, include: ORDER_INCLUDE });
    return { payment, orders };
  }

  const result = await paystack.verifyTransaction(reference);

  if (!result.status || result.data.status !== "success") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw ApiError.badRequest("Payment was not successful");
  }

  const expectedKobo = Math.round(payment.amount * 100);
  if (result.data.amount !== expectedKobo) {
    throw ApiError.badRequest("Payment amount does not match the order total");
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  const orders = await orderService.createOrdersForPayment(payment.buyerId, payment.id);

  return { payment: updated, orders };
}

export async function verifyPayment(userId: string, reference: string) {
  const payment = await prisma.payment.findUnique({ where: { reference } });

  if (!payment || payment.buyerId !== userId) {
    throw ApiError.notFound("Payment not found");
  }

  return confirmPayment(reference);
}

export async function handleChargeSuccessWebhook(reference: string) {
  await confirmPayment(reference);
}

export function getPublicConfig() {
  return { publicKey: env.PAYSTACK_PUBLIC_KEY };
}
