import { createPaymentWindow } from "@/lib/embed-payments";
import { corsHeadersForOrigin, json, noContent } from "@/lib/embed-cors";
import { validateEmbedSessionRequest } from "@/lib/embed-token";
import {
  createDonation,
  getProjectEmbedState,
  insertEmbedAnalyticsEvent,
  isOriginAllowed,
  resolveRequestOrigin,
  updateDonationAfterCreate
} from "@/lib/embed-store";
import { buildBaseUrl, createIdempotencyKey, parseAmount, resolveSafeReturnUrl, sanitizePageUrlForOrigin, sanitizeText } from "@/lib/embed-utils";
import { buildRateLimitKey, checkRateLimit, getClientIp } from "@/lib/request-guards";

export const runtime = "nodejs";

const allowedMethods = new Set(["CARD", "TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE_PHONE"]);
const isFakePaymentMode = process.env.LOCAL_TEST_MODE === "1" || process.env.FAKE_PAYMENT_MODE === "1";

function parseHostFromUrl(value: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host || null;
  } catch (error) {
    return null;
  }
}

export async function OPTIONS(request: Request) {
  return noContent(corsHeadersForOrigin(resolveRequestOrigin(request)));
}

export async function POST(request: Request) {
  const requestOrigin = resolveRequestOrigin(request);
  const responseHeaders = corsHeadersForOrigin(requestOrigin);
  const respond = (data: unknown, status: number) => json(data, status, responseHeaders);
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    return respond({ error: "JSON 요청 본문이 필요합니다." }, 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const state = await getProjectEmbedState(projectId);
  if (!state) {
    return respond({ error: "존재하지 않는 projectId입니다." }, 400);
  }

  if (!requestOrigin || requestOrigin === "null") {
    return respond({ error: "유효한 요청 origin이 필요합니다." }, 403);
  }

  const visitorId = sanitizeText(body.visitorId, 80);
  const sessionId = sanitizeText(body.sessionId, 80);
  const embedValidation = validateEmbedSessionRequest(request, body, {
    projectId: state.project.id,
    expectedSessionId: sessionId,
    expectedVisitorId: visitorId
  });
  if (!embedValidation.ok) {
    return respond({ error: embedValidation.error }, 403);
  }

  if (!isOriginAllowed(state.allowedOrigins, requestOrigin)) {
    return respond({ error: "이 origin은 허용되지 않았습니다." }, 403);
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("create-payment", state.project.id, requestOrigin, getClientIp(request), sessionId),
    limit: 12,
    windowMs: 10 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return respond({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  const amount = parseAmount(body.amount);
  const currency = sanitizeText(body.currency || state.settings.currency, 5, state.settings.currency).toUpperCase();
  const creator = sanitizeText(body.creator || state.settings.creatorName, 48, state.settings.creatorName);
  const campaign = sanitizeText(body.campaign || state.settings.campaign, 48, state.settings.campaign);
  const message = sanitizeText(body.message, 120);
  const method = sanitizeText(body.method || state.settings.paymentMethod, 32, state.settings.paymentMethod).toUpperCase();
  const safePageUrl = sanitizePageUrlForOrigin(body.pageUrl, requestOrigin);
  const safeReturnUrl = resolveSafeReturnUrl(safePageUrl, requestOrigin);

  if (!Number.isFinite(amount) || amount < state.settings.minAmount || amount > state.settings.maxAmount) {
    return respond({ error: "후원 금액이 허용 범위를 벗어났습니다." }, 400);
  }

  if (currency !== state.settings.currency) {
    return respond({ error: `현재는 ${state.settings.currency} 결제만 지원합니다.` }, 400);
  }

  if (!allowedMethods.has(method)) {
    return respond({ error: "지원하지 않는 결제 수단입니다." }, 400);
  }

  try {
    const donation = await createDonation({
      projectId: state.project.id,
      amount,
      currency,
      orderName: sanitizeText(body.orderName || `${creator} Support`, 100, `${creator} Support`),
      creator,
      campaign,
      supporterName: sanitizeText(body.supporterName, 40),
      message,
      originUrl: requestOrigin,
      pageUrl: safeReturnUrl,
      method
    });

    await insertEmbedAnalyticsEvent({
      type: "donation_submit",
      projectId: state.project.id,
      visitorId,
      sessionId,
      creator,
      campaign,
      host: parseHostFromUrl(safePageUrl) || sanitizeText(body.host, 255) || parseHostFromUrl(requestOrigin) || undefined,
      pageUrl: safePageUrl,
      pagePath: sanitizeText(body.pagePath, 500),
      referrer: sanitizeText(body.referrer, 1000),
      metadata: {
        method,
        sessionBound: true
      }
    });

    const baseUrl = buildBaseUrl(request);
    let checkoutUrl = "";

    if (isFakePaymentMode) {
      const checkout = new URL("/local-checkout", baseUrl);
      checkout.searchParams.set("orderId", donation.orderId);
      checkout.searchParams.set("amount", String(amount));
      checkout.searchParams.set("projectId", state.project.id);
      checkoutUrl = checkout.toString();
    } else {
      const payment = await createPaymentWindow({
        idempotencyKey: createIdempotencyKey("create_payment"),
        method,
        amount,
        currency,
        orderId: donation.orderId,
        orderName: donation.orderName,
        successUrl: `${baseUrl}/success`,
        failUrl: `${baseUrl}/fail`
      });
      checkoutUrl = typeof payment?.checkout?.url === "string" ? payment.checkout.url : "";
    }

    if (!checkoutUrl) {
      throw new Error("결제 checkout URL을 받지 못했습니다.");
    }

    await updateDonationAfterCreate(donation.orderId, checkoutUrl);

    return respond(
      {
        projectId: state.project.id,
        orderId: donation.orderId,
        checkoutUrl,
        messagePublicStatus: donation.messagePublicStatus
      },
      200
    );
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "체크아웃 생성에 실패했습니다." }, 500);
  }
}
