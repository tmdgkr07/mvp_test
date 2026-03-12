import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const SUPPORT_TIER_LABELS: Record<string, string> = {
  starter: "5 밥알",
  supporter: "10 밥알",
  angel: "30 밥알"
};

function getSupportDetail(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "새로운 응원이 도착했어요";
  }

  const values = metadata as Record<string, unknown>;
  const tier = typeof values.tier === "string" ? SUPPORT_TIER_LABELS[values.tier] : undefined;

  if (tier) {
    return `${tier} 응원이 도착했어요`;
  }

  const amount = typeof values.amount === "number" ? values.amount : undefined;
  if (amount) {
    return `${amount.toLocaleString("ko-KR")}원 응원이 도착했어요`;
  }

  return "새로운 응원이 도착했어요";
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const ownedProjects = await prisma.project.findMany({
    where: {
      ownerId: session.user.id,
      deletedAt: null
    },
    select: {
      id: true,
      name: true
    }
  });

  if (ownedProjects.length === 0) {
    return ok({
      items: [],
      feedbackCount: 0,
      supportCount: 0,
      latestCreatedAt: null
    });
  }

  const projectIds = ownedProjects.map((project) => project.id);
  const projectNameById = new Map(ownedProjects.map((project) => [project.id, project.name]));

  const [feedbackCount, supportCount, feedbackRows, supportRows] = await Promise.all([
    prisma.feedback.count({
      where: {
        projectId: { in: projectIds }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        projectId: { in: projectIds },
        type: "support_button_click"
      }
    }),
    prisma.feedback.findMany({
      where: {
        projectId: { in: projectIds }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6,
      select: {
        id: true,
        projectId: true,
        comment: true,
        createdAt: true
      }
    }),
    prisma.analyticsEvent.findMany({
      where: {
        projectId: { in: projectIds },
        type: "support_button_click"
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 6,
      select: {
        id: true,
        projectId: true,
        timestamp: true,
        metadata: true
      }
    })
  ]);

  const items = [
    ...feedbackRows.map((item) => ({
      id: `feedback-${item.id}`,
      kind: "feedback" as const,
      projectId: item.projectId,
      projectName: projectNameById.get(item.projectId) ?? "알 수 없는 서비스",
      detail: item.comment,
      createdAt: item.createdAt.toISOString(),
      href: `/dashboard?projectId=${item.projectId}&tab=feedback`
    })),
    ...supportRows.map((item) => ({
      id: `support-${item.id}`,
      kind: "support" as const,
      projectId: item.projectId ?? "",
      projectName: item.projectId ? projectNameById.get(item.projectId) ?? "알 수 없는 서비스" : "알 수 없는 서비스",
      detail: getSupportDetail(item.metadata),
      createdAt: item.timestamp.toISOString(),
      href: item.projectId ? `/dashboard?projectId=${item.projectId}&tab=rice` : "/dashboard?tab=rice"
    }))
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);

  return ok({
    items,
    feedbackCount,
    supportCount,
    latestCreatedAt: items[0]?.createdAt ?? null
  });
}
