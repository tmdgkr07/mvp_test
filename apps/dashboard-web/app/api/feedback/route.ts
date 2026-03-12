import { fail, ok } from "@/lib/api-response";
import { appendEvent, createFeedback, getProjectById } from "@/lib/data-store";
import { detectSentiment } from "@/lib/analytics";
import { sanitizeText } from "@/lib/embed-utils";
import { buildRateLimitKey, checkRateLimit, getClientIp } from "@/lib/request-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    projectId?: string;
    sessionId?: string;
    comment?: string;
  };

  try {
    body = (await request.json()) as {
      projectId?: string;
      sessionId?: string;
      comment?: string;
    };
  } catch {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  const projectId = sanitizeText(body.projectId, 80);
  const sessionId = sanitizeText(body.sessionId, 120);
  const comment = sanitizeText(body.comment, 500);

  if (!projectId) {
    return fail("INVALID_INPUT", "projectId가 필요합니다.");
  }

  if (!sessionId) {
    return fail("INVALID_INPUT", "sessionId가 필요합니다.");
  }

  if (!comment) {
    return fail("INVALID_INPUT", "피드백을 입력해주세요.");
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey("feedback", projectId, sessionId, getClientIp(request)),
    limit: 8,
    windowMs: 10 * 60 * 1000
  });
  if (!rateLimit.ok) {
    return fail("RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return fail("NOT_FOUND", "존재하지 않는 프로젝트입니다.", 404);
  }

  const feedback = await createFeedback({
    projectId,
    sessionId,
    comment,
    sentiment: detectSentiment(comment)
  });

  await appendEvent({
    type: "feedback_submit",
    sessionId,
    projectId
  });

  return ok({ feedback }, { status: 201 });
}
