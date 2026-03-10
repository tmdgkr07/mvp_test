import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import {
  archiveEmbedProjectForOwner,
  createEmbedProjectForOwner,
  ensureDashboardUser,
  findEmbedProjectForOwner,
  getEmbedHubPayload,
  listEmbedProjectsForOwner
} from "@/lib/embed-hub";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

async function getOwnerUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return {
      session: null,
      ownerUser: null
    };
  }

  const ownerUser = await ensureDashboardUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image
  });

  return {
    session,
    ownerUser
  };
}

function buildEmptyResponse() {
  return {
    projects: [],
    selectedProjectId: null,
    selectedProjectName: null,
    widgetScriptUrl: null,
    serviceUrl: null,
    adminUrl: null,
    publicMessagesUrl: null,
    websiteUrl: null,
    websiteOrigin: null,
    embedProject: null,
    requiresToken: false,
    snippet: null,
    overview: null,
    feedback: [],
    topPages: [],
    series: []
  };
}

export async function GET(request: Request) {
  const { ownerUser } = await getOwnerUser();

  if (!ownerUser) {
    return fail("UNAUTHORIZED", "임베드 서비스 허브를 사용하려면 로그인이 필요합니다.", 401);
  }

  const projects = await listEmbedProjectsForOwner(Number(ownerUser.id));
  if (!projects.length) {
    return ok(buildEmptyResponse());
  }

  const url = new URL(request.url);
  const requestedProjectId = url.searchParams.get("projectId")?.trim() || "";
  const days = Number.parseInt(url.searchParams.get("days") || "30", 10);
  const selectedProject = projects.find((project) => project.id === requestedProjectId) || projects[0];

  try {
    const payload = await getEmbedHubPayload(selectedProject, days);

    return ok({
      projects,
      ...payload
    });
  } catch (error) {
    return fail(
      "EMBED_HUB_ERROR",
      error instanceof Error ? error.message : "임베드 서비스 허브 데이터를 불러오지 못했습니다.",
      500
    );
  }
}

export async function POST(request: Request) {
  const { ownerUser } = await getOwnerUser();

  if (!ownerUser) {
    return fail("UNAUTHORIZED", "외부 임베드 서비스를 만들려면 로그인이 필요합니다.", 401);
  }

  let body: {
    name?: string;
    websiteUrl?: string;
  };

  try {
    body = (await request.json()) as { name?: string; websiteUrl?: string };
  } catch (error) {
    return fail("INVALID_BODY", "JSON 요청 본문이 필요합니다.");
  }

  try {
    const project = await createEmbedProjectForOwner({
      ownerUserId: Number(ownerUser.id),
      name: body.name || "",
      websiteUrl: body.websiteUrl || ""
    });
    const [projects, payload] = await Promise.all([
      listEmbedProjectsForOwner(Number(ownerUser.id)),
      getEmbedHubPayload(project, 30)
    ]);

    return ok(
      {
        projects,
        ...payload
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(
      "CREATE_EMBED_PROJECT_ERROR",
      error instanceof Error ? error.message : "외부 임베드 서비스를 만들지 못했습니다.",
      400
    );
  }
}

export async function DELETE(request: Request) {
  const { ownerUser } = await getOwnerUser();

  if (!ownerUser) {
    return fail("UNAUTHORIZED", "서비스를 삭제하려면 로그인이 필요합니다.", 401);
  }

  let body: {
    projectId?: string;
  };

  try {
    body = (await request.json()) as { projectId?: string };
  } catch (error) {
    return fail("INVALID_BODY", "JSON 요청 본문이 필요합니다.");
  }

  const projectId = String(body.projectId || "").trim();
  if (!projectId) {
    return fail("INVALID_INPUT", "삭제할 서비스 ID가 필요합니다.");
  }

  try {
    const deletedProject = await archiveEmbedProjectForOwner(projectId, Number(ownerUser.id));
    if (!deletedProject) {
      return fail("NOT_FOUND", "삭제할 서비스를 찾지 못했습니다.", 404);
    }

    const projects = await listEmbedProjectsForOwner(Number(ownerUser.id));
    const nextSelectedProject = projects[0] || null;
    const payload = nextSelectedProject ? await getEmbedHubPayload(nextSelectedProject, 30) : buildEmptyResponse();

    return ok({
      deletedProjectId: deletedProject.id,
      projects,
      ...payload
    });
  } catch (error) {
    return fail(
      "DELETE_EMBED_PROJECT_ERROR",
      error instanceof Error ? error.message : "서비스를 삭제하지 못했습니다.",
      500
    );
  }
}
