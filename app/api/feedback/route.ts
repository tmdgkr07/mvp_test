import { fail, ok } from "@/lib/api-response";
import { appendEvent, createFeedback, getProjectById } from "@/lib/data-store";
import { detectSentiment } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    projectId?: string;
    sessionId?: string;
    comment?: string;
  };

  if (!body.projectId?.trim()) {
    return fail("INVALID_INPUT", "projectId가 필요합니다.");
  }

  if (!body.sessionId?.trim()) {
    return fail("INVALID_INPUT", "sessionId가 필요합니다.");
  }

  const comment = body.comment?.trim();
  if (!comment) {
    return fail("INVALID_INPUT", "피드백을 입력해주세요.");
  }

  const project = await getProjectById(body.projectId.trim());
  if (!project) {
    return fail("NOT_FOUND", "존재하지 않는 프로젝트입니다.", 404);
  }

  const feedback = await createFeedback({
    projectId: body.projectId.trim(),
    sessionId: body.sessionId.trim(),
    comment,
    sentiment: detectSentiment(comment)
  });

  await appendEvent({
    type: "feedback_submit",
    sessionId: body.sessionId.trim(),
    projectId: body.projectId.trim()
  });

  return ok({ feedback }, { status: 201 });
}
