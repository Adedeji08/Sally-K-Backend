import { env } from "./env.js";

const BASE_URL = "https://api.paystack.co";

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<PaystackResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as PaystackResponse<T>;
  return body;
}

export interface InitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Restricting channels to card + bank transfer so Paystack's own hosted
// page/popup only offers those two, matching what the storefront shows.
export function initializeTransaction(params: { email: string; amountKobo: number; reference: string; callbackUrl: string }) {
  return paystackRequest<InitializeTransactionData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ["card", "bank_transfer"],
    }),
  });
}

export interface VerifyTransactionData {
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string;
  customer: { email: string };
}

export function verifyTransaction(reference: string) {
  return paystackRequest<VerifyTransactionData>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
}
