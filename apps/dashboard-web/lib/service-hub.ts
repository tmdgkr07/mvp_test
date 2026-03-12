import { unstable_cache } from "next/cache";
import type { Session } from "next-auth";
import { listOwnedProjects } from "@/lib/data-store";
import {
  getEmbedMetricsSummary,
  listCreatorFeedbackMessagesForProjectIds,
  type EmbedMetricsSummary
} from "@/lib/embed-store";
import { prisma } from "@/lib/prisma";
import { isOfficiallyLaunched } from "@/lib/project-status";
import type { Project } from "@/lib/types";

export type ServiceHubFeedbackMessage = {
  id: string;
  amount: number;
  currency: string;
  supporterName: string | null;
  message: string | null;
  createdAt: string;
  approvedAt: string | null;
  creatorReadAt: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ServiceHubBootstrapData = {
  aggregateFeedbackMessages: ServiceHubFeedbackMessage[];
  aggregateSummary: EmbedMetricsSummary;
  projects: Project[];
  waitlistCount: number;
};

const EMPTY_SUMMARY: EmbedMetricsSummary = {
  avgDwellSeconds: 0,
  donationAttempts: 0,
  donationSuccessCount: 0,
  errorCount: 0,
  feedbackCount: 0,
  repeatVisitorRate: 0,
  repeatVisitors: 0,
  totalAmount: 0,
  uniqueVisitors: 0,
  views: 0,
  visits: 0,
  widgetOpens: 0
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

function serializeFeedbackMessage(
  message: Awaited<ReturnType<typeof listCreatorFeedbackMessagesForProjectIds>>[number]
): ServiceHubFeedbackMessage {
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

const getCachedAggregateSummary = unstable_cache(
  async (projectKey: string) => {
    const projectIds = parseProjectKey(projectKey);
    if (projectIds.length === 0) {
      return EMPTY_SUMMARY;
    }

    return getEmbedMetricsSummary(projectIds);
  },
  ["service-hub-aggregate-summary"],
  { revalidate: 60 }
);

const getCachedAggregateFeedbackMessages = unstable_cache(
  async (projectKey: string) => {
    const projectIds = parseProjectKey(projectKey);
    if (projectIds.length === 0) {
      return [] as ServiceHubFeedbackMessage[];
    }

    const messages = await listCreatorFeedbackMessagesForProjectIds(projectIds, 5, "all");
    return messages.map(serializeFeedbackMessage);
  },
  ["service-hub-aggregate-feedback"],
  { revalidate: 30 }
);

export async function getServiceHubBootstrap(session: Session | null): Promise<ServiceHubBootstrapData> {
  const projects = await listOwnedProjects(session);
  const projectIds = projects.map((project) => project.id);
  const launchedProjectIds = projects.filter((project) => isOfficiallyLaunched(project.status)).map((project) => project.id);
  const launchedProjectKey = buildProjectKey(launchedProjectIds);

  const [waitlistCount, aggregateSummary, aggregateFeedbackMessages] = await Promise.all([
    projectIds.length > 0 ? prisma.waitlist.count({ where: { projectId: { in: projectIds } } }) : Promise.resolve(0),
    launchedProjectKey ? getCachedAggregateSummary(launchedProjectKey) : Promise.resolve(EMPTY_SUMMARY),
    launchedProjectKey ? getCachedAggregateFeedbackMessages(launchedProjectKey) : Promise.resolve([])
  ]);

  return {
    aggregateFeedbackMessages,
    aggregateSummary,
    projects,
    waitlistCount
  };
}
