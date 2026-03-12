import { assertEnv } from "@/lib/embed-utils";

function createAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function tossRequest(path: string, options: {
  method?: string;
  idempotencyKey?: string;
  body?: Record<string, unknown>;
} = {}) {
  const secretKey = assertEnv("TOSS_SECRET_KEY");
  const response = await fetch(`https://api.tosspayments.com${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: createAuthHeader(secretKey),
      "Content-Type": "application/json",
      "Accept-Language": "ko-KR",
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : typeof data?.code === "string" ? data.code : "토스 결제 요청에 실패했습니다.";
    throw new Error(message);
  }

  return data as Record<string, any>;
}

export function createPaymentWindow(input: {
  idempotencyKey: string;
  method: string;
  amount: number;
  currency: string;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
}) {
  return tossRequest("/v1/payments", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      orderName: input.orderName,
      successUrl: input.successUrl,
      failUrl: input.failUrl,
      flowMode: "DEFAULT"
    }
  });
}

export function confirmPayment(input: {
  idempotencyKey: string;
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  return tossRequest("/v1/payments/confirm", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount
    }
  });
}
