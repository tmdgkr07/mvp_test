import type { EventType } from "@/lib/types";
import { fail, ok } from "@/lib/api-response";
import { appendEvent, getProjectById, normalizeEventMetadata } from "@/lib/data-store";
import { sanitizeText } from "@/lib/embed-utils";
import { buildRateLimitKey, checkRateLimit, getClientIp } from "@/lib/request-guards";

export const runtime = "nodejs";

const VALID_TYPES: EventType[] = [
  "project_impression",
  "website_click",
  "support_button_click",
  "feedback_submit",
  "session_end"
];

function sanitizeEventMetadata(input: unknown) {
  const normalized = normalizeEventMetadata(input);
  if (!normalized) {
    return undefined;
  }

  const entries = Object.entries(normalized).slice(0, 20).map(([key, value]) => {
    const safeKey = sanitizeText(key, 40);
    if (typeof value === "string") {
      return [safeKey, sanitizeText(value, 200)] as const;
    }

    return [safeKey, value] as const;
  });

  const next = Object.fromEntries(entries);
  return JSON.stringify(next).length <= 1000 ? next : undefined;
}

export async function POST(request: Request) {
  let body: {
    type?: EventType;
    sessionId?: string;
    projectId?: string;
    metadata?: Record<string, string | number | boolean | null>;
  };

  try {
    body = (await request.json()) as {
      type?: EventType;
      sessionId?: string;
      projectId?: string;
      metadata?: Record<string, string | number | boolean | null>;
    };
  } catch {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return fail("INVALID_INPUT", "유효하지 않은 이벤트 타입입니다.");
  }

  const sessionId = sanitizeText(body.sessionId, 120);
  if (!sessionId) {
    return fail("INVALID_INPUT", "sessionId가 필요합니다.");
  }

  const projectId = sanitizeText(body.projectId, 80);
  if (projectId) {
    const project = await getProjectById(projectId);
    if (!project) {
      return fail("NOT_FOUND", "존재하지 않는 프로젝트입니다.", 404);
    }
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("events", body.type, projectId, sessionId, getClientIp(request)),
    limit: 120,
    windowMs: 10 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return fail("RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  const event = await appendEvent({
    type: body.type,
    sessionId,
    projectId: projectId || undefined,
    metadata: sanitizeEventMetadata(body.metadata)
  });

  return ok({ event }, { status: 201 });
}
