import { confirmPayment } from "@/lib/embed-payments";
import { corsHeadersForOrigin, json, noContent } from "@/lib/embed-cors";
import { findDonationByOrderId, resolveRequestOrigin, updateDonationFromPayment } from "@/lib/embed-store";
import { buildBaseUrl, createIdempotencyKey, parseAmount, resolveSafeReturnUrl } from "@/lib/embed-utils";

export const runtime = "nodejs";

const isFakePaymentMode = process.env.LOCAL_TEST_MODE === "1" || process.env.FAKE_PAYMENT_MODE === "1";

export async function OPTIONS(request: Request) {
  return noContent(corsHeadersForOrigin(resolveRequestOrigin(request)));
}

export async function POST(request: Request) {
  const requestOrigin = resolveRequestOrigin(request);
  const allowedOrigin = new URL(buildBaseUrl(request)).origin;
  const responseHeaders = corsHeadersForOrigin(requestOrigin);
  const respond = (data: unknown, status: number) => json(data, status, responseHeaders);
  let body: Record<string, unknown>;

  if (requestOrigin && requestOrigin !== allowedOrigin) {
    return respond({ error: "결제 확인은 성공 페이지 origin에서만 허용됩니다." }, 403);
  }

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return respond({ error: "JSON 요청 본문이 필요합니다." }, 400);
  }

  const paymentKey = String(body.paymentKey || "").trim();
  const orderId = String(body.orderId || "").trim();
  const amount = parseAmount(body.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return respond({ error: "paymentKey, orderId, amount가 필요합니다." }, 400);
  }

  try {
    const donation = await findDonationByOrderId(orderId);

    if (!donation) {
      return respond({ error: "후원 주문을 찾을 수 없습니다." }, 404);
    }

    const returnUrl = resolveSafeReturnUrl(donation.pageUrl, donation.originUrl);
    if (donation.amount !== amount) {
      return respond({ error: "결제 금액 검증에 실패했습니다." }, 400);
    }

    if (donation.status === "DONE" && donation.paymentKey === paymentKey) {
      return respond({ ok: true, alreadyConfirmed: true, donation, returnUrl }, 200);
    }

    const payment = isFakePaymentMode
      ? {
          paymentKey,
          orderId,
          status: "DONE",
          method: donation.method || "CARD",
          approvedAt: new Date().toISOString(),
          receipt: {
            url: `${allowedOrigin}/success?orderId=${encodeURIComponent(orderId)}`
          },
          easyPay: null
        }
      : await confirmPayment({
          idempotencyKey: createIdempotencyKey("confirm_payment"),
          paymentKey,
          orderId,
          amount
        });

    const updatedDonation = await updateDonationFromPayment(orderId, payment, payment, "CONFIRM_API");

    return respond(
      {
        ok: true,
        payment,
        donation: updatedDonation,
        returnUrl
      },
      200
    );
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "결제 확인에 실패했습니다." }, 500);
  }
}
