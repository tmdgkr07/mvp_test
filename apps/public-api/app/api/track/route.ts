import { corsHeadersForOrigin, json, noContent } from "@/lib/embed-cors";
import { validateEmbedSessionRequest } from "@/lib/embed-token";
import { getProjectEmbedState, insertEmbedAnalyticsEvent, isOriginAllowed, resolveRequestOrigin } from "@/lib/embed-store";
import { parseAmount, sanitizePageUrlForOrigin, sanitizeText } from "@/lib/embed-utils";
import { buildRateLimitKey, checkRateLimit, getClientIp } from "@/lib/request-guards";

export const runtime = "nodejs";

const allowedEventTypes = new Set(["view", "widget_open", "donation_submit", "engagement"]);

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const jsonText = JSON.stringify(value);
  if (!jsonText || jsonText.length > 1000) {
    return null;
  }

  return JSON.parse(jsonText) as Record<string, unknown>;
}

function sanitizeDurationMs(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.min(value, 24 * 60 * 60 * 1000);
}

function parseHostFromUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).host || "";
  } catch {
    return "";
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
  } catch {
    return respond({ error: "JSON 요청 본문이 필요합니다." }, 400);
  }

  const eventType = sanitizeText(body.eventType, 40);
  if (!allowedEventTypes.has(eventType)) {
    return respond({ error: "지원하지 않는 이벤트 타입입니다." }, 400);
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
    return respond({ error: "이 origin은 허용되지 않습니다." }, 403);
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("embed-track", state.project.id, requestOrigin, getClientIp(request), eventType),
    limit: eventType === "view" ? 240 : 120,
    windowMs: 5 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return respond({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  const safePageUrl = sanitizePageUrlForOrigin(body.pageUrl, requestOrigin);

  try {
    await insertEmbedAnalyticsEvent({
      type: eventType,
      projectId: state.project.id,
      visitorId,
      sessionId,
      creator: sanitizeText(body.creator || state.settings.creatorName, 48, state.settings.creatorName),
      campaign: sanitizeText(body.campaign || state.settings.campaign, 48, state.settings.campaign),
      host: parseHostFromUrl(safePageUrl) || sanitizeText(body.host, 255),
      pageUrl: safePageUrl,
      pagePath: sanitizeText(body.pagePath, 500),
      referrer: sanitizeText(body.referrer, 1000),
      durationMs: sanitizeDurationMs(parseAmount(body.durationMs)),
      metadata: sanitizeMetadata(body.metadata)
    });

    return noContent(responseHeaders);
  } catch (error) {
    console.error("[public-api/track]", error);
    return respond({ error: "분석 이벤트 기록에 실패했습니다." }, 500);
  }
}
