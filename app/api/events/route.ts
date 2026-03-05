import type { EventType } from "@/lib/types";
import { fail, ok } from "@/lib/api-response";
import { appendEvent, normalizeEventMetadata } from "@/lib/data-store";

export const runtime = "nodejs";

const VALID_TYPES: EventType[] = [
  "project_impression",
  "website_click",
  "support_button_click",
  "feedback_submit",
  "session_end"
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    type?: EventType;
    sessionId?: string;
    projectId?: string;
    metadata?: Record<string, string | number | boolean | null>;
  };

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return fail("INVALID_INPUT", "유효하지 않은 이벤트 타입입니다.");
  }

  if (!body.sessionId?.trim()) {
    return fail("INVALID_INPUT", "sessionId가 필요합니다.");
  }

  const event = await appendEvent({
    type: body.type,
    sessionId: body.sessionId.trim(),
    projectId: body.projectId?.trim() || undefined,
    metadata: normalizeEventMetadata(body.metadata)
  });

  return ok({ event }, { status: 201 });
}
