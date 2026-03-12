import { DonationStatus } from "@prisma/client";
import { prisma as db } from "@/lib/prisma";

const EMBED_EVENT_TYPES = ["view", "widget_open", "donation_submit", "engagement"] as const;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type DashboardProjectRef = {
  id: string;
  name: string;
  slug: string;
};

type TrendAccumulator = EmbedDashboardTrendPoint & {
  engagementBySession: Map<string, number>;
  uniqueVisitorsSet: Set<string>;
  visitsSet: Set<string>;
};

type BreakdownAccumulator = {
  campaign: string;
  donationAttempts: number;
  donationSuccessCount: number;
  feedbackCount: number;
  host: string | null;
  key: string;
  label: string;
  pagePath: string;
  projectId: string | null;
  projectName: string | null;
  totalAmount: number;
  uniqueVisitorsSet: Set<string>;
  visitsSet: Set<string>;
  views: number;
  widgetOpens: number;
  engagementBySession: Map<string, number>;
};

export type EmbedDashboardDateRangeOptions = {
  days?: number;
  endDate?: Date;
  startDate?: Date;
};

export type EmbedDashboardOverview = {
  avgDwellSeconds: number;
  donationAttempts: number;
  donationSuccessCount: number;
  errorCount: number;
  feedbackCount: number;
  repeatVisitorRate: number;
  repeatVisitors: number;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

export type EmbedDashboardTrendPoint = {
  avgDwellSeconds: number;
  day: string;
  donationAttempts: number;
  donationSuccessCount: number;
  feedbackCount: number;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

export type EmbedDashboardCampaignRow = {
  avgDwellSeconds: number;
  campaign: string;
  donationAttempts: number;
  donationSuccessCount: number;
  feedbackCount: number;
  key: string;
  projectId: string | null;
  projectName: string | null;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

export type EmbedDashboardPageRow = {
  avgDwellSeconds: number;
  campaign: string;
  donationAttempts: number;
  donationSuccessCount: number;
  feedbackCount: number;
  host: string | null;
  key: string;
  pagePath: string;
  projectId: string | null;
  projectName: string | null;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

export type EmbedDashboardReferrerRow = {
  key: string;
  referrer: string;
  uniqueVisitors: number;
  views: number;
  visits: number;
};

export type EmbedDashboardEventTypeRow = {
  count: number;
  label: string;
  type: string;
};

export type EmbedDashboardRecentEvent = {
  campaign: string | null;
  durationMs: number | null;
  host: string | null;
  id: string;
  pagePath: string | null;
  pageUrl: string | null;
  project: DashboardProjectRef | null;
  referrer: string | null;
  sessionId: string;
  timestamp: string;
  type: string;
  visitorId: string | null;
};

export type EmbedAnalyticsDashboardData = {
  campaigns: EmbedDashboardCampaignRow[];
  eventTypes: EmbedDashboardEventTypeRow[];
  overview: EmbedDashboardOverview;
  pages: EmbedDashboardPageRow[];
  recentEvents: EmbedDashboardRecentEvent[];
  referrers: EmbedDashboardReferrerRow[];
  trends: EmbedDashboardTrendPoint[];
};

type NormalizedDateRange = {
  dayCount: number;
  endDate: Date;
  startDate: Date;
};

function normalizeProjectIds(projectIds?: string[] | null) {
  return Array.from(new Set((projectIds || []).map((item) => String(item || "").trim()).filter(Boolean)));
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function toDayStart(input: Date) {
  const next = new Date(input);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayEnd(input: Date) {
  const next = new Date(input);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateRange(options?: EmbedDashboardDateRangeOptions): NormalizedDateRange {
  if (options?.startDate && options?.endDate) {
    const startDate = toDayStart(options.startDate);
    const endDate = toDayEnd(options.endDate);
    const dayCount = Math.floor((toDayStart(endDate).getTime() - startDate.getTime()) / DAY_IN_MS) + 1;

    return {
      dayCount: Math.max(1, Math.min(365, dayCount)),
      endDate,
      startDate
    };
  }

  const clampedDays = Math.max(7, Math.min(365, Number.isFinite(options?.days) ? Math.trunc(options!.days!) : 30));
  const endDate = toDayEnd(new Date());
  const startDate = toDayStart(new Date(endDate.getTime() - (clampedDays - 1) * DAY_IN_MS));

  return {
    dayCount: clampedDays,
    endDate,
    startDate
  };
}

function buildDayKeys(range: NormalizedDateRange) {
  const rows: string[] = [];
  let cursor = toDayStart(range.startDate);

  while (cursor <= range.endDate) {
    rows.push(formatDayKey(cursor));
    cursor = new Date(cursor.getTime() + DAY_IN_MS);
  }

  return rows;
}

function readMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  return (metadata as Record<string, unknown>)[key];
}

function readMetadataString(metadata: unknown, key: string) {
  const value = readMetadataValue(metadata, key);
  return typeof value === "string" ? value.trim() : "";
}

function readMetadataNumber(metadata: unknown, key: string) {
  const value = readMetadataValue(metadata, key);
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getVisitorKey(sessionId: string, metadata: unknown) {
  const visitorId = readMetadataString(metadata, "visitorId");
  return visitorId || sessionId;
}

function parseUrlParts(url: string | null | undefined) {
  const normalized = String(url || "").trim();
  if (!normalized) {
    return {
      host: null,
      pagePath: "/"
    };
  }

  try {
    const parsed = new URL(normalized);
    return {
      host: parsed.host || null,
      pagePath: `${parsed.pathname || "/"}${parsed.search || ""}`
    };
  } catch {
    return {
      host: normalized,
      pagePath: "/"
    };
  }
}

function getEventLabel(type: string) {
  if (type === "view") return "페이지 노출";
  if (type === "widget_open") return "위젯 열기";
  if (type === "donation_submit") return "후원 시도";
  if (type === "engagement") return "체류 기록";
  return type;
}

function createEmptyOverview(): EmbedDashboardOverview {
  return {
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
}

function createTrendAccumulator(day: string): TrendAccumulator {
  return {
    avgDwellSeconds: 0,
    day,
    donationAttempts: 0,
    donationSuccessCount: 0,
    feedbackCount: 0,
    totalAmount: 0,
    uniqueVisitors: 0,
    uniqueVisitorsSet: new Set<string>(),
    views: 0,
    visits: 0,
    visitsSet: new Set<string>(),
    widgetOpens: 0,
    engagementBySession: new Map<string, number>()
  };
}

function finalizeTrendRows(rows: TrendAccumulator[]) {
  return rows.map((row) => {
    const engagementValues = Array.from(row.engagementBySession.values());

    return {
      avgDwellSeconds:
        engagementValues.length > 0
          ? roundToSingleDecimal(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length / 1000)
          : 0,
      day: row.day,
      donationAttempts: row.donationAttempts,
      donationSuccessCount: row.donationSuccessCount,
      feedbackCount: row.feedbackCount,
      totalAmount: row.totalAmount,
      uniqueVisitors: row.uniqueVisitorsSet.size,
      views: row.views,
      visits: row.visitsSet.size,
      widgetOpens: row.widgetOpens
    };
  });
}

function createBreakdownAccumulator(
  key: string,
  input: {
    campaign?: string | null;
    host?: string | null;
    label: string;
    pagePath?: string | null;
    projectId?: string | null;
    projectName?: string | null;
  }
): BreakdownAccumulator {
  return {
    campaign: input.campaign || "default",
    donationAttempts: 0,
    donationSuccessCount: 0,
    feedbackCount: 0,
    host: input.host || null,
    key,
    label: input.label,
    pagePath: input.pagePath || "/",
    projectId: input.projectId || null,
    projectName: input.projectName || null,
    totalAmount: 0,
    uniqueVisitorsSet: new Set<string>(),
    visitsSet: new Set<string>(),
    views: 0,
    widgetOpens: 0,
    engagementBySession: new Map<string, number>()
  };
}

function finalizeBreakdown<T extends { donationSuccessCount: number; totalAmount: number; views: number }>(
  rows: BreakdownAccumulator[],
  mapper: (row: BreakdownAccumulator, avgDwellSeconds: number) => T
) {
  return rows
    .map((row) => {
      const engagementValues = Array.from(row.engagementBySession.values());
      const avgDwellSeconds =
        engagementValues.length > 0
          ? roundToSingleDecimal(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length / 1000)
          : 0;

      return mapper(row, avgDwellSeconds);
    })
    .sort((left, right) => {
      if (right.totalAmount !== left.totalAmount) {
        return right.totalAmount - left.totalAmount;
      }

      if (right.views !== left.views) {
        return right.views - left.views;
      }

      return right.donationSuccessCount - left.donationSuccessCount;
    });
}

export async function getEmbedAnalyticsDashboardData(
  projectIds: string[] | null | undefined,
  rangeOptions?: EmbedDashboardDateRangeOptions
): Promise<EmbedAnalyticsDashboardData> {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  const range = normalizeDateRange(rangeOptions);

  if (projectIds && normalizedProjectIds.length === 0) {
    return {
      campaigns: [],
      eventTypes: [],
      overview: createEmptyOverview(),
      pages: [],
      recentEvents: [],
      referrers: [],
      trends: finalizeTrendRows(buildDayKeys(range).map((day) => createTrendAccumulator(day)))
    };
  }

  const projectFilter =
    normalizedProjectIds.length > 0
      ? {
          in: normalizedProjectIds
        }
      : undefined;

  const [events, donations] = await Promise.all([
    db.analyticsEvent.findMany({
      where: {
        projectId: projectFilter,
        timestamp: {
          gte: range.startDate,
          lte: range.endDate
        },
        type: {
          in: EMBED_EVENT_TYPES as unknown as string[]
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      select: {
        id: true,
        metadata: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        projectId: true,
        sessionId: true,
        timestamp: true,
        type: true
      }
    }),
    db.donation.findMany({
      where: {
        projectId: projectFilter,
        OR: [
          {
            createdAt: {
              gte: range.startDate,
              lte: range.endDate
            }
          },
          {
            approvedAt: {
              gte: range.startDate,
              lte: range.endDate
            }
          }
        ]
      },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      select: {
        amount: true,
        approvedAt: true,
        campaign: true,
        createdAt: true,
        message: true,
        originUrl: true,
        pageUrl: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        projectId: true,
        status: true
      }
    })
  ]);

  const viewEvents = events.filter((event) => event.type === "view");
  const widgetOpenEvents = events.filter((event) => event.type === "widget_open");
  const donationAttemptEvents = events.filter((event) => event.type === "donation_submit");

  const visitorSessions = new Map<string, Set<string>>();
  const engagementBySession = new Map<string, number>();
  const trendRows = new Map<string, TrendAccumulator>();
  for (const day of buildDayKeys(range)) {
    trendRows.set(day, createTrendAccumulator(day));
  }

  const campaignRows = new Map<string, BreakdownAccumulator>();
  const pageRows = new Map<string, BreakdownAccumulator>();
  const referrerRows = new Map<string, { key: string; referrer: string; uniqueVisitorsSet: Set<string>; views: number; visitsSet: Set<string> }>();
  const eventTypeCounts = new Map<string, number>();

  for (const event of events) {
    const dayKey = formatDayKey(new Date(event.timestamp));
    const trendRow = trendRows.get(dayKey);
    const sessionId = String(event.sessionId || "").trim();
    const visitorKey = getVisitorKey(sessionId, event.metadata);
    const campaign = readMetadataString(event.metadata, "campaign") || "default";
    const host = readMetadataString(event.metadata, "host") || null;
    const pagePath = readMetadataString(event.metadata, "pagePath") || "/";
    const referrer = readMetadataString(event.metadata, "referrer");
    const projectName = event.project?.name || null;

    eventTypeCounts.set(event.type, (eventTypeCounts.get(event.type) || 0) + 1);

    const campaignKey = `${event.projectId || "all"}::${campaign}`;
    if (!campaignRows.has(campaignKey)) {
      campaignRows.set(
        campaignKey,
        createBreakdownAccumulator(campaignKey, {
          campaign,
          label: campaign,
          projectId: event.projectId,
          projectName
        })
      );
    }
    const campaignRow = campaignRows.get(campaignKey)!;

    const pageKey = `${event.projectId || "all"}::${host || "-"}::${pagePath}::${campaign}`;
    if (!pageRows.has(pageKey)) {
      pageRows.set(
        pageKey,
        createBreakdownAccumulator(pageKey, {
          campaign,
          host,
          label: pagePath,
          pagePath,
          projectId: event.projectId,
          projectName
        })
      );
    }
    const pageRow = pageRows.get(pageKey)!;

    if (event.type === "view") {
      if (trendRow) {
        trendRow.views += 1;
        if (sessionId) {
          trendRow.visitsSet.add(sessionId);
        }
        if (visitorKey) {
          trendRow.uniqueVisitorsSet.add(visitorKey);
        }
      }

      campaignRow.views += 1;
      pageRow.views += 1;

      if (sessionId) {
        campaignRow.visitsSet.add(sessionId);
        pageRow.visitsSet.add(sessionId);
      }
      if (visitorKey) {
        campaignRow.uniqueVisitorsSet.add(visitorKey);
        pageRow.uniqueVisitorsSet.add(visitorKey);

        const sessions = visitorSessions.get(visitorKey) || new Set<string>();
        if (sessionId) {
          sessions.add(sessionId);
        }
        visitorSessions.set(visitorKey, sessions);
      }

      const referrerKey = (() => {
        if (!referrer) {
          return "direct";
        }

        try {
          return new URL(referrer).host || referrer;
        } catch {
          return referrer;
        }
      })();

      if (!referrerRows.has(referrerKey)) {
        referrerRows.set(referrerKey, {
          key: referrerKey,
          referrer: referrerKey === "direct" ? "직접 유입" : referrerKey,
          uniqueVisitorsSet: new Set<string>(),
          views: 0,
          visitsSet: new Set<string>()
        });
      }

      const referrerRow = referrerRows.get(referrerKey)!;
      referrerRow.views += 1;
      if (sessionId) {
        referrerRow.visitsSet.add(sessionId);
      }
      if (visitorKey) {
        referrerRow.uniqueVisitorsSet.add(visitorKey);
      }
    }

    if (event.type === "widget_open") {
      if (trendRow) {
        trendRow.widgetOpens += 1;
      }
      campaignRow.widgetOpens += 1;
      pageRow.widgetOpens += 1;
    }

    if (event.type === "donation_submit") {
      if (trendRow) {
        trendRow.donationAttempts += 1;
      }
      campaignRow.donationAttempts += 1;
      pageRow.donationAttempts += 1;
    }

    if (event.type === "engagement") {
      const durationMs = readMetadataNumber(event.metadata, "durationMs");
      if (durationMs > 0 && sessionId) {
        if (trendRow) {
          trendRow.engagementBySession.set(sessionId, (trendRow.engagementBySession.get(sessionId) || 0) + durationMs);
        }
        campaignRow.engagementBySession.set(sessionId, (campaignRow.engagementBySession.get(sessionId) || 0) + durationMs);
        pageRow.engagementBySession.set(sessionId, (pageRow.engagementBySession.get(sessionId) || 0) + durationMs);
        engagementBySession.set(sessionId, (engagementBySession.get(sessionId) || 0) + durationMs);
      }
    }
  }

  for (const donation of donations) {
    if (donation.status !== DonationStatus.DONE) {
      continue;
    }

    const effectiveDate = donation.approvedAt || donation.createdAt;
    if (effectiveDate < range.startDate || effectiveDate > range.endDate) {
      continue;
    }

    const dayKey = formatDayKey(new Date(effectiveDate));
    const trendRow = trendRows.get(dayKey);
    if (trendRow) {
      trendRow.donationSuccessCount += 1;
      trendRow.totalAmount += donation.amount;
      if (String(donation.message || "").trim()) {
        trendRow.feedbackCount += 1;
      }
    }

    const campaign = String(donation.campaign || "default").trim() || "default";
    const campaignKey = `${donation.projectId}::${campaign}`;
    if (!campaignRows.has(campaignKey)) {
      campaignRows.set(
        campaignKey,
        createBreakdownAccumulator(campaignKey, {
          campaign,
          label: campaign,
          projectId: donation.projectId,
          projectName: donation.project?.name || null
        })
      );
    }
    const campaignRow = campaignRows.get(campaignKey)!;
    campaignRow.donationSuccessCount += 1;
    campaignRow.totalAmount += donation.amount;
    if (String(donation.message || "").trim()) {
      campaignRow.feedbackCount += 1;
    }

    const pageParts = parseUrlParts(donation.pageUrl || donation.originUrl);
    const pageKey = `${donation.projectId}::${pageParts.host || "-"}::${pageParts.pagePath}::${campaign}`;
    if (!pageRows.has(pageKey)) {
      pageRows.set(
        pageKey,
        createBreakdownAccumulator(pageKey, {
          campaign,
          host: pageParts.host,
          label: pageParts.pagePath,
          pagePath: pageParts.pagePath,
          projectId: donation.projectId,
          projectName: donation.project?.name || null
        })
      );
    }
    const pageRow = pageRows.get(pageKey)!;
    pageRow.donationSuccessCount += 1;
    pageRow.totalAmount += donation.amount;
    if (String(donation.message || "").trim()) {
      pageRow.feedbackCount += 1;
    }
  }

  const repeatVisitors = Array.from(visitorSessions.values()).filter((sessions) => sessions.size > 1).length;
  const uniqueVisitors = visitorSessions.size;
  const repeatVisitorRate = uniqueVisitors > 0 ? roundToSingleDecimal((repeatVisitors / uniqueVisitors) * 100) : 0;
  const engagementValues = Array.from(engagementBySession.values());

  const overview: EmbedDashboardOverview = {
    avgDwellSeconds:
      engagementValues.length > 0
        ? roundToSingleDecimal(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length / 1000)
        : 0,
    donationAttempts: donationAttemptEvents.length,
    donationSuccessCount: Array.from(campaignRows.values()).reduce((sum, row) => sum + row.donationSuccessCount, 0),
    errorCount: 0,
    feedbackCount: Array.from(campaignRows.values()).reduce((sum, row) => sum + row.feedbackCount, 0),
    repeatVisitorRate,
    repeatVisitors,
    totalAmount: Array.from(campaignRows.values()).reduce((sum, row) => sum + row.totalAmount, 0),
    uniqueVisitors,
    views: viewEvents.length,
    visits: new Set(viewEvents.map((event) => event.sessionId).filter(Boolean)).size,
    widgetOpens: widgetOpenEvents.length
  };

  const trends = finalizeTrendRows(Array.from(trendRows.values()));
  const campaigns = finalizeBreakdown(Array.from(campaignRows.values()), (row, avgDwellSeconds) => ({
    avgDwellSeconds,
    campaign: row.campaign,
    donationAttempts: row.donationAttempts,
    donationSuccessCount: row.donationSuccessCount,
    feedbackCount: row.feedbackCount,
    key: row.key,
    projectId: row.projectId,
    projectName: row.projectName,
    totalAmount: row.totalAmount,
    uniqueVisitors: row.uniqueVisitorsSet.size,
    views: row.views,
    visits: row.visitsSet.size,
    widgetOpens: row.widgetOpens
  })).slice(0, 8);

  const pages = finalizeBreakdown(Array.from(pageRows.values()), (row, avgDwellSeconds) => ({
    avgDwellSeconds,
    campaign: row.campaign,
    donationAttempts: row.donationAttempts,
    donationSuccessCount: row.donationSuccessCount,
    feedbackCount: row.feedbackCount,
    host: row.host,
    key: row.key,
    pagePath: row.pagePath,
    projectId: row.projectId,
    projectName: row.projectName,
    totalAmount: row.totalAmount,
    uniqueVisitors: row.uniqueVisitorsSet.size,
    views: row.views,
    visits: row.visitsSet.size,
    widgetOpens: row.widgetOpens
  })).slice(0, 8);

  const referrers = Array.from(referrerRows.values())
    .map((row) => ({
      key: row.key,
      referrer: row.referrer,
      uniqueVisitors: row.uniqueVisitorsSet.size,
      views: row.views,
      visits: row.visitsSet.size
    }))
    .sort((left, right) => {
      if (right.views !== left.views) {
        return right.views - left.views;
      }

      return right.uniqueVisitors - left.uniqueVisitors;
    })
    .slice(0, 8);

  const eventTypes = Array.from(eventTypeCounts.entries())
    .map(([type, count]) => ({
      count,
      label: getEventLabel(type),
      type
    }))
    .sort((left, right) => right.count - left.count);

  const recentEvents = events.slice(0, 20).map((event) => ({
    campaign: readMetadataString(event.metadata, "campaign") || null,
    durationMs: (() => {
      const duration = readMetadataNumber(event.metadata, "durationMs");
      return duration > 0 ? duration : null;
    })(),
    host: readMetadataString(event.metadata, "host") || null,
    id: event.id,
    pagePath: readMetadataString(event.metadata, "pagePath") || null,
    pageUrl: readMetadataString(event.metadata, "pageUrl") || null,
    project: event.project
      ? {
          id: event.project.id,
          name: event.project.name,
          slug: event.project.slug
        }
      : null,
    referrer: readMetadataString(event.metadata, "referrer") || null,
    sessionId: event.sessionId,
    timestamp: event.timestamp.toISOString(),
    type: event.type,
    visitorId: readMetadataString(event.metadata, "visitorId") || null
  }));

  return {
    campaigns,
    eventTypes,
    overview,
    pages,
    recentEvents,
    referrers,
    trends
  };
}
