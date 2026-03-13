import { corsHeadersForOrigin, json, noContent } from "@/lib/embed-cors";
import { createEmbedSessionNonce, createEmbedSessionToken, validateBootstrapRequest } from "@/lib/embed-token";
import { buildWidgetBootstrapSettings, getProjectEmbedState, isOriginAllowed, resolveRequestOrigin } from "@/lib/embed-store";
import { sanitizePageUrlForOrigin, sanitizeText } from "@/lib/embed-utils";
import { buildRateLimitKey, checkRateLimit, getClientIp } from "@/lib/request-guards";

export const runtime = "nodejs";

const EMBED_SESSION_TTL_SECONDS = 60 * 2;
const EMBED_SESSION_REFRESH_BUFFER_SECONDS = 45;

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

  const projectId = sanitizeText(body.projectId, 80);
  const state = await getProjectEmbedState(projectId);
  if (!state) {
    return respond({ error: "존재하지 않는 projectId입니다." }, 400);
  }

  if (!requestOrigin || requestOrigin === "null") {
    return respond({ error: "유효한 요청 origin이 필요합니다." }, 403);
  }

  const bootstrapValidation = validateBootstrapRequest(request, body, {
    projectId: state.project.id,
    requireSignedEmbed: state.settings.requireSignedEmbed
  });
  if (!bootstrapValidation.ok) {
    return respond({ error: bootstrapValidation.error }, 403);
  }

  if (!isOriginAllowed(state.allowedOrigins, requestOrigin)) {
    return respond({ error: "이 origin은 허용되지 않습니다." }, 403);
  }

  const sessionId = sanitizeText(body.sessionId, 80);
  const visitorId = sanitizeText(body.visitorId, 80);
  const pageUrl = sanitizePageUrlForOrigin(body.pageUrl, requestOrigin);

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("embed-bootstrap", state.project.id, requestOrigin, getClientIp(request)),
    limit: 60,
    windowMs: 10 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return respond({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  const sessionNonce = createEmbedSessionNonce();
  const expiresAt = Math.floor(Date.now() / 1000) + EMBED_SESSION_TTL_SECONDS;
  const sessionToken = createEmbedSessionToken({
    projectId: state.project.id,
    origin: requestOrigin,
    expiresAt,
    sessionId,
    sessionNonce,
    visitorId
  });

  return respond(
    {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      pageUrl,
      projectId: state.project.id,
      refreshAfterSeconds: Math.max(EMBED_SESSION_TTL_SECONDS - EMBED_SESSION_REFRESH_BUFFER_SECONDS, 20),
      sessionNonce,
      sessionToken,
      settings: buildWidgetBootstrapSettings(state.settings)
    },
    200
  );
}
