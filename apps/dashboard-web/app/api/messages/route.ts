import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { fail } from "@/lib/api-response";
import { getProjectById, listOwnedProjects } from "@/lib/data-store";
import {
  getCreatorFeedbackCounts,
  listCreatorFeedbackMessagesForProjectIds,
  listCreatorFeedbackMessagesWithFilter,
  markCreatorFeedbackMessageAsRead,
  markCreatorFeedbackMessagesAsRead,
  type CreatorFeedbackReadFilter
} from "@/lib/embed-store";
import { canManageProject } from "@/lib/permissions";
import { validateTrustedAppMutation } from "@/lib/request-guards";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

function serializeCreatorMessage(
  message: Awaited<ReturnType<typeof listCreatorFeedbackMessagesForProjectIds>>[number]
) {
  return {
    id: message.id,
    amount: message.amount,
    currency: message.currency,
    supporterName: message.supporterName,
    message: message.message,
    createdAt: message.createdAt.toISOString(),
    approvedAt: message.approvedAt ? message.approvedAt.toISOString() : null,
    creatorReadAt: message.creatorReadAt ? message.creatorReadAt.toISOString() : null,
    project: {
      id: message.project.id,
      name: message.project.name,
      slug: message.project.slug
    }
  };
}

function parseRequestedProjectIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseReadFilter(value: unknown): CreatorFeedbackReadFilter {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "read") return "read";
  if (normalized === "unread") return "unread";
  return "all";
}

function parseLimit(value: unknown, fallback = 30) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : fallback;
}

async function resolveManageableProjectIds(session: Session | null) {
  const projects = await listOwnedProjects(session);
  return projects.map((project) => project.id);
}

async function resolveMessageScope(
  session: Session | null,
  input: {
    projectId?: string | null;
    projectIds?: string[];
  }
) {
  if (!session?.user?.id) {
    return { error: fail("UNAUTHORIZED", "로그인이 필요합니다.", 401) };
  }

  const requestedProjectId = String(input.projectId || "").trim();
  if (requestedProjectId) {
    const project = await getProjectById(requestedProjectId);
    if (!project) {
      return { error: fail("NOT_FOUND", "프로젝트를 찾을 수 없습니다.", 404) };
    }

    if (!canManageProject(session, project.ownerId)) {
      return { error: fail("FORBIDDEN", "메시지를 볼 권한이 없습니다.", 403) };
    }

    return {
      projectId: project.id,
      projectIds: [project.id]
    };
  }

  const manageableProjectIds = await resolveManageableProjectIds(session);
  const requestedProjectIds = parseRequestedProjectIds(input.projectIds);
  return {
    projectId: "",
    projectIds:
      requestedProjectIds.length > 0 ? manageableProjectIds.filter((id) => requestedProjectIds.includes(id)) : manageableProjectIds
  };
}

async function listMessagesForScope(
  scope: Exclude<Awaited<ReturnType<typeof resolveMessageScope>>, { error: Response }>,
  limit: number,
  filter: CreatorFeedbackReadFilter
) {
  return scope.projectId
    ? listCreatorFeedbackMessagesWithFilter(limit, scope.projectId, filter)
    : listCreatorFeedbackMessagesForProjectIds(scope.projectIds, limit, filter);
}

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"), 30);
  const filter = parseReadFilter(searchParams.get("filter"));
  const scope = await resolveMessageScope(session, {
    projectId: searchParams.get("projectId"),
    projectIds: parseRequestedProjectIds(searchParams.get("projectIds"))
  });

  if ("error" in scope) {
    return scope.error;
  }

  const [messages, counts] = await Promise.all([listMessagesForScope(scope, limit, filter), getCreatorFeedbackCounts(scope.projectIds)]);

  return Response.json({
    data: {
      counts,
      messages: messages.map(serializeCreatorMessage)
    }
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const trust = validateTrustedAppMutation(request);
  if (!trust.ok) {
    return fail("FORBIDDEN", trust.error, 403);
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("INVALID_JSON", "JSON 요청 본문이 필요합니다.", 400);
  }

  const action = String(body.action || "").trim();
  if (action !== "mark-all-read" && action !== "mark-read") {
    return fail("INVALID_ACTION", "지원하지 않는 요청입니다.", 400);
  }

  const scope = await resolveMessageScope(session, {
    projectId: typeof body.projectId === "string" ? body.projectId : "",
    projectIds: parseRequestedProjectIds(body.projectIds)
  });

  if ("error" in scope) {
    return scope.error;
  }

  if (action === "mark-all-read") {
    await markCreatorFeedbackMessagesAsRead(scope.projectIds);
  } else {
    const messageId = String(body.messageId || "").trim();
    if (!messageId) {
      return fail("INVALID_MESSAGE_ID", "읽음 처리할 메시지 ID가 필요합니다.", 400);
    }

    const result = await markCreatorFeedbackMessageAsRead(scope.projectIds, messageId);
    if (result.count === 0) {
      return fail("NOT_FOUND", "읽음 처리할 메시지를 찾지 못했습니다.", 404);
    }
  }

  const filter = parseReadFilter(body.filter);
  const limit = parseLimit(body.limit, 30);
  const [counts, messages] = await Promise.all([getCreatorFeedbackCounts(scope.projectIds), listMessagesForScope(scope, limit, filter)]);

  return Response.json({
    data: {
      counts,
      messages: messages.map(serializeCreatorMessage)
    }
  });
}
