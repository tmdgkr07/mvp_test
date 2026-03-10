import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { getEmbedHubPayload } from "@/lib/embed-hub";
import { listProjects } from "@/lib/data-store";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return fail("UNAUTHORIZED", "임베드 서비스 허브를 사용하려면 로그인이 필요합니다.", 401);
  }

  const allProjects = await listProjects();
  const ownedProjects = allProjects.filter((project) => project.ownerId === session.user.id);

  if (!ownedProjects.length) {
    return ok({
      projects: [],
      selectedProjectId: null,
      selectedProjectName: null,
      widgetScriptUrl: null,
      serviceUrl: null,
      adminUrl: null,
      publicMessagesUrl: null,
      websiteOrigin: null,
      embedProject: null,
      requiresToken: false,
      snippet: null,
      overview: null,
      feedback: [],
      topPages: [],
      series: []
    });
  }

  const url = new URL(request.url);
  const requestedProjectId = url.searchParams.get("projectId")?.trim() || "";
  const days = Number.parseInt(url.searchParams.get("days") || "30", 10);
  const selectedProject =
    ownedProjects.find((project) => project.id === requestedProjectId) || ownedProjects[0];

  try {
    const payload = await getEmbedHubPayload(
      selectedProject,
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      },
      days
    );

    return ok({
      projects: ownedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
        websiteUrl: project.websiteUrl,
        thumbnailUrl: project.thumbnailUrl
      })),
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
