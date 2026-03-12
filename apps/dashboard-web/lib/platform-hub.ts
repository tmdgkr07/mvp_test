import { unstable_cache } from "next/cache";
import type { Session } from "next-auth";
import { buildDashboard } from "@/lib/analytics";
import { listEventsForProjectIds, listFeedbackForProjectIds, listOwnedProjects } from "@/lib/data-store";
import { prisma } from "@/lib/prisma";
import type { Feedback, FunnelStage, Project } from "@/lib/types";

export type DashboardPayload = {
  funnel: Array<{ stage: string; key: FunnelStage; count: number }>;
  dropOff: Array<{ from: string; fromKey: FunnelStage; to: string; toKey: FunnelStage; lostUsers: number; rate: number }>;
  exitReport: Array<{ stage: string; stageKey: FunnelStage; exits: number; rate: number }>;
  avgSessionSeconds: number;
  totalSessions: number;
  feedback: Feedback[];
  supportSummary: {
    supportClickCount: number;
    estimatedAmount: number;
    totalRice: number;
    tierBreakdown: Array<{
      tier: string;
      label: string;
      count: number;
      amount: number;
      rice: number;
    }>;
  };
};

export type WaitlistEntry = {
  email: string;
  createdAt: string;
  projectId: string;
};

export type BuilderDashboardBootstrapData = {
  projects: Project[];
  waitlistCount: number;
  waitlist: WaitlistEntry[];
  dashboard: DashboardPayload;
};

function buildProjectKey(projectIds: string[]) {
  return Array.from(new Set(projectIds.map((item) => item.trim()).filter(Boolean))).sort().join(",");
}

function parseProjectKey(projectKey: string) {
  return projectKey
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const getCachedAggregateDashboard = unstable_cache(
  async (projectKey: string) => {
    const projectIds = parseProjectKey(projectKey);
    if (projectIds.length === 0) {
      return buildDashboard([], []) as DashboardPayload;
    }

    const [events, feedback] = await Promise.all([listEventsForProjectIds(projectIds), listFeedbackForProjectIds(projectIds)]);
    return buildDashboard(events, feedback) as DashboardPayload;
  },
  ["platform-hub-aggregate-dashboard"],
  { revalidate: 60 }
);

export async function getPlatformHubBootstrap(session: Session | null): Promise<BuilderDashboardBootstrapData> {
  const projects = await listOwnedProjects(session);
  const projectIds = projects.map((project) => project.id);
  const projectKey = buildProjectKey(projectIds);

  const [waitlistCount, waitlist, dashboard] = await Promise.all([
    projectIds.length > 0 ? prisma.waitlist.count({ where: { projectId: { in: projectIds } } }) : Promise.resolve(0),
    projectIds.length > 0
      ? prisma.waitlist.findMany({
          where: { projectId: { in: projectIds } },
          orderBy: { createdAt: "desc" },
          select: { email: true, createdAt: true, projectId: true }
        })
      : Promise.resolve([]),
    projectKey ? getCachedAggregateDashboard(projectKey) : Promise.resolve(buildDashboard([], []) as DashboardPayload)
  ]);

  return {
    projects,
    waitlistCount,
    waitlist: waitlist.map((entry) => ({
      email: entry.email,
      createdAt: entry.createdAt.toISOString(),
      projectId: entry.projectId
    })),
    dashboard
  };
}
